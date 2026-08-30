import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DashboardStats, BatchSummary, BatchDetails } from "./buildpay";

/**
 * Direct server-side database helper to fetch dashboard stats
 */
export async function getDashboardData(): Promise<DashboardStats> {
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

  return {
    totalBatches,
    totalTransactions,
    totalMatched,
    totalExceptions,
    averageMatchRate,
    confirmedAmount,
  };
}

/**
 * Direct server-side database helper to fetch all batches
 */
export async function getBatchesData(): Promise<BatchSummary[]> {
  const batches = await db.batch.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          bankTransactions: true,
          matches: true,
        },
      },
    },
  });

  return batches.map((batch) => {
    const totalTransactions = batch._count.bankTransactions;
    const matchedTransactions = batch._count.matches;
    const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

    return {
      id: batch.id,
      name: batch.name,
      status: batch.status,
      createdAt: batch.createdAt.toISOString(),
      totalTransactions,
      matchedTransactions,
      matchRate,
    };
  });
}

/**
 * Direct server-side database helper to fetch detailed records for a batch
 */
export async function getBatchDetailsData(id: string): Promise<BatchDetails | null> {
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
    return null;
  }

  const { bankTransactions, matches, exceptions, ...batchData } = batch;

  const totalTransactions = bankTransactions.length;
  const matchedTransactions = matches.length;
  const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

  const matchedTxIds = new Set(matches.map((m) => m.bankTransactionId));
  const confirmedAmountDecimal = bankTransactions
    .filter((tx) => matchedTxIds.has(tx.id))
    .reduce((sum, tx) => sum.plus(tx.amount), new Prisma.Decimal(0));

  return {
    batch: {
      id: batchData.id,
      name: batchData.name,
      bankName: batchData.bankName,
      status: batchData.status,
      createdAt: batchData.createdAt.toISOString(),
      updatedAt: batchData.updatedAt.toISOString(),
    },
    summary: {
      totalTransactions,
      matchedTransactions,
      matchRate,
      confirmedAmount: confirmedAmountDecimal.toNumber(),
    },
    matches: matches.map((m) => ({
      id: m.id,
      batchId: m.batchId,
      bankTransactionId: m.bankTransactionId,
      settlementId: m.settlementId,
      confidence: m.confidence,
      confidenceLevel: m.confidenceLevel,
      ruleUsed: m.ruleUsed,
      explanation: m.explanation,
      createdAt: m.createdAt.toISOString(),
    })),
    exceptions: exceptions.map((e) => ({
      id: e.id,
      batchId: e.batchId,
      bankTransactionId: e.bankTransactionId,
      settlementId: e.settlementId,
      type: e.type,
      explanation: e.explanation,
      createdAt: e.createdAt.toISOString(),
    })),
    transactions: bankTransactions.map((tx) => ({
      id: tx.id,
      batchId: tx.batchId,
      transactionDate: tx.transactionDate.toISOString(),
      referenceId: tx.referenceId,
      description: tx.description,
      amount: tx.amount.toString(),
      transactionType: tx.transactionType,
      rawData: tx.rawData,
      createdAt: tx.createdAt.toISOString(),
    })),
  };
}
