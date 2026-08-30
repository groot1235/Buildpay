import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Run aggregated platform queries concurrently
    const [
      totalBatches,
      totalTransactions,
      totalMatched,
      totalExceptions,
      confirmedAmountAggregate,
      batchesData,
    ] = await Promise.all([
      db.batch.count(),
      db.bankTransaction.count(),
      db.match.count(),
      db.exception.count(),
      // Aggregate confirmed amounts in the database using join condition on Match relation
      db.bankTransaction.aggregate({
        where: {
          match: {
            isNot: null,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      // Fetch relation counts to compute the average match rate across batches
      db.batch.findMany({
        select: {
          _count: {
            select: {
              bankTransactions: true,
              matches: true,
            },
          },
        },
      }),
    ]);

    // Compute the average match rate of all active batches
    let matchRateSum = 0;
    let batchesWithTxs = 0;

    for (const b of batchesData) {
      const txsCount = b._count.bankTransactions;
      if (txsCount > 0) {
        matchRateSum += (b._count.matches / txsCount) * 100;
        batchesWithTxs++;
      }
    }

    const averageMatchRate = batchesWithTxs > 0 ? matchRateSum / batchesWithTxs : 0;
    const confirmedAmount = Number(confirmedAmountAggregate._sum.amount || 0);

    return NextResponse.json({
      totalBatches,
      totalTransactions,
      totalMatched,
      totalExceptions,
      averageMatchRate,
      confirmedAmount,
    });
  } catch (error: any) {
    console.error("Fetch dashboard statistics API error:", error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
