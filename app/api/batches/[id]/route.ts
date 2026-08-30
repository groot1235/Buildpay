import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Load the batch and all of its related records in one optimized query
    const batch = await db.batch.findUnique({
      where: { id },
      include: {
        bankTransactions: {
          orderBy: { transactionDate: "desc" },
        },
        matches: true,
        exceptions: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: `Batch with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    const { bankTransactions, matches, exceptions, ...batchData } = batch;

    // Calculate summary statistics in-memory
    const totalTransactions = bankTransactions.length;
    const matchedTransactions = matches.length;
    const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

    // Map matched transaction IDs to a Set for O(1) in-memory lookup
    const matchedTxIds = new Set(matches.map((m) => m.bankTransactionId));
    
    // Sum amounts using Decimal precision
    const confirmedAmountDecimal = bankTransactions
      .filter((tx) => matchedTxIds.has(tx.id))
      .reduce((sum, tx) => sum.plus(tx.amount), new Prisma.Decimal(0));

    return NextResponse.json({
      batch: batchData,
      summary: {
        totalTransactions,
        matchedTransactions,
        matchRate,
        confirmedAmount: confirmedAmountDecimal.toNumber(),
      },
      matches,
      exceptions,
      transactions: bankTransactions,
    });
  } catch (error: any) {
    console.error("Fetch batch details API error:", error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
