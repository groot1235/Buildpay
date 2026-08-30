import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // Validate if the batch exists
    const batch = await db.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { error: `Batch with ID "${batchId}" not found.` },
        { status: 404 }
      );
    }

    // Fetch transactions count, matches and exceptions
    const [totalTransactions, matches, exceptions] = await Promise.all([
      db.bankTransaction.count({ where: { batchId } }),
      db.match.findMany({ where: { batchId } }),
      db.exception.findMany({ where: { batchId } }),
    ]);

    // Fetch matched transactions to compute confirmedAmount
    const matchedTxIds = matches.map((m) => m.bankTransactionId);
    let confirmedAmountDecimal = new Prisma.Decimal(0);

    if (matchedTxIds.length > 0) {
      const matchedBankTxs = await db.bankTransaction.findMany({
        where: { id: { in: matchedTxIds } },
        select: { amount: true },
      });
      confirmedAmountDecimal = matchedBankTxs.reduce(
        (sum, tx) => sum.plus(tx.amount),
        new Prisma.Decimal(0)
      );
    }

    const matchedTransactions = matches.length;
    const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

    await db.notification.create({
      data: {
        type: "REPORT_GENERATED",
        title: "Report Generated",
        message: `Auditing report compiled for batch "${batch.name}" with match rate of ${matchRate.toFixed(1)}%.`,
      },
    });

    return NextResponse.json({
      summary: {
        totalTransactions,
        matchedTransactions,
        matchRate,
        confirmedAmount: confirmedAmountDecimal.toNumber(),
      },
      matches,
      exceptions,
    });
  } catch (error: any) {
    console.error("Fetch reconciliation report API error:", error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
