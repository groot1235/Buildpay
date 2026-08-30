import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db";
import { TransactionType } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit/log";

function parseAndNormalizeRow(record: Record<string, string>, bank: string) {
  const keys = Object.keys(record);
  const getVal = (possibleKeys: string[]) => {
    const pkLower = possibleKeys.map(k => k.toLowerCase());
    for (const key of keys) {
      if (pkLower.includes(key.toLowerCase().trim())) {
        return record[key];
      }
    }
    return undefined;
  };

  let dateStr: string | undefined;
  let refStr: string | undefined;
  let amountStr: string | undefined;
  let descStr: string | undefined;

  switch (bank.toUpperCase()) {
    case "ICICI":
      dateStr = getVal(["transaction date", "value date", "date"]);
      refStr = getVal(["cheque number", "ref no.", "reference", "utr"]);
      amountStr = getVal(["deposit (cr)", "deposit", "credit", "amount"]);
      descStr = getVal(["transaction remarks", "description", "particulars"]);
      break;
    case "SBI":
      dateStr = getVal(["txn date", "value date", "date"]);
      refStr = getVal(["ref no./cheque no.", "cheque no", "reference", "utr"]);
      amountStr = getVal(["credit", "deposit", "amount"]);
      descStr = getVal(["description", "particulars"]);
      break;
    case "AXIS":
      dateStr = getVal(["tran date", "date"]);
      refStr = getVal(["chqno", "reference", "utr"]);
      amountStr = getVal(["cr", "credit", "amount"]);
      descStr = getVal(["particulars", "description"]);
      break;
    case "KOTAK":
      dateStr = getVal(["transaction date", "value date", "date"]);
      refStr = getVal(["chq/ref no", "reference", "utr"]);
      amountStr = getVal(["amount", "credit"]);
      descStr = getVal(["description", "particulars"]);
      break;
    case "HDFC":
    default:
      dateStr = getVal(["date", "transaction date", "transaction_date"]);
      refStr = getVal(["chq./ref.no.", "reference", "utr", "transaction id"]);
      amountStr = getVal(["deposit amt.", "credit amount", "amount"]);
      descStr = getVal(["narration", "description"]);
      break;
  }

  // Fallbacks
  if (!dateStr) dateStr = getVal(["date", "txn date", "transaction date", "tran date"]);
  if (!refStr) refStr = getVal(["reference", "ref", "utr", "chq./ref.no.", "ref no./cheque no.", "chqno", "chq/ref no"]);
  if (!amountStr) amountStr = getVal(["amount", "deposit", "deposit amt.", "deposit (cr)", "credit", "cr"]);
  if (!descStr) descStr = getVal(["description", "narration", "particulars", "transaction remarks"]);

  return { dateStr, refStr, amountStr, descStr };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || `Imported Batch - ${new Date().toLocaleString()}`;
    let bankName = (formData.get("bankName") as string) || "";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the maximum limit of 10MB." },
        { status: 400 }
      );
    }

    const csvContent = await file.text();
    let records: Record<string, string>[] = [];

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `Failed to parse CSV: ${parseError.message}` },
        { status: 400 }
      );
    }

    // Auto-detect bank from column headers if not passed explicitly
    if (!bankName || bankName === "AUTO" || bankName === "Select bank") {
      const firstRecordKeys = Object.keys(records[0] || {}).map(k => k.toLowerCase().trim());
      if (firstRecordKeys.some(k => k.includes("transaction remarks") || k.includes("withdrawal (dr)"))) {
        bankName = "ICICI";
      } else if (firstRecordKeys.some(k => k.includes("txn date") || k.includes("ref no./cheque no."))) {
        bankName = "SBI";
      } else if (firstRecordKeys.some(k => k.includes("particulars") || k.includes("bal"))) {
        bankName = "AXIS";
      } else if (firstRecordKeys.some(k => k.includes("chq/ref no") || k.includes("dr/cr"))) {
        bankName = "KOTAK";
      } else {
        bankName = "HDFC";
      }
    }

    const bankTransactionsToCreate: any[] = [];

    for (const record of records) {
      const { dateStr, refStr, amountStr, descStr } = parseAndNormalizeRow(record, bankName);

      if (!dateStr || !amountStr) {
        continue; // skip rows missing key values
      }

      // Parse Date
      const transactionDate = new Date(dateStr);
      if (isNaN(transactionDate.getTime())) {
        continue;
      }

      // Parse Amount (strip currency symbols and commas)
      const cleanedAmount = amountStr.replace(/[^0-9.-]/g, "");
      const amountNum = parseFloat(cleanedAmount);
      if (isNaN(amountNum)) {
        continue;
      }

      bankTransactionsToCreate.push({
        transactionDate,
        referenceId: refStr?.trim() || null,
        description: descStr?.trim() || null,
        amount: amountNum.toFixed(2),
        transactionType: TransactionType.CREDIT,
        rawData: record,
      });
    }

    if (bankTransactionsToCreate.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid bank transactions found in CSV." },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          name,
          bankName,
          status: "CREATED",
        },
      });

      const transactionsData = bankTransactionsToCreate.map((txData) => ({
        ...txData,
        batchId: batch.id,
      }));

      await tx.bankTransaction.createMany({
        data: transactionsData,
      });

      return {
        batchId: batch.id,
        transactionsImported: transactionsData.length,
      };
    });

    await db.notification.create({
      data: {
        type: "BATCH_UPLOADED",
        title: "Batch Uploaded",
        message: `Statement batch "${name}" successfully imported. ${result.transactionsImported} transactions processed.`,
      },
    });

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress || "admin@buildpay.co";
    const userName = clerkUser?.fullName || "Admin User";

    await logAudit({
      action: "UPLOAD",
      userEmail,
      userName,
      entityType: "BATCH",
      entityId: result.batchId,
      entityName: name,
    });

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      transactionsImported: result.transactionsImported,
    });
  } catch (error: any) {
    console.error("CSV Upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
