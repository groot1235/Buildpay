import "dotenv/config";
import { db } from "@/lib/db";
import { getDashboardData } from "@/lib/api/buildpay-server";
import { generateReconciliationSummary } from "@/lib/ai/generateReconciliationSummary";

async function main() {
  try {
    console.log("Calling getDashboardData()...");
    const dashboardStats = await getDashboardData();
    console.log("dashboardStats:", dashboardStats);

    console.log("Querying lastSyncRecord...");
    const lastSyncRecord = await db.razorpaySync.findFirst({
      orderBy: { syncDate: "desc" },
    });
    console.log("lastSyncRecord:", lastSyncRecord);

    console.log("Querying settlementVolume...");
    const settlementVolume = await db.settlement.aggregate({
      _sum: { amount: true },
    });
    console.log("settlementVolume:", settlementVolume);

    console.log("Querying batchesFromDb...");
    const [batchesFromDb, confirmedAmountAggregate] = await Promise.all([
      db.batch.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: {
            select: {
              bankTransactions: true,
              matches: true,
              exceptions: true,
            },
          },
          bankTransactions: {
            where: { match: { isNot: null } },
            select: { amount: true },
          },
        },
      }),
      db.bankTransaction.aggregate({
        _sum: { amount: true },
        where: { match: { isNot: null } },
      }),
    ]);
    console.log("batchesFromDb count:", batchesFromDb.length);
    console.log("confirmedAmountAggregate:", confirmedAmountAggregate);

    const totalTransactions = dashboardStats.totalTransactions;
    console.log("Checking zero data condition: batches:", batchesFromDb.length, "transactions:", totalTransactions);
    
    if (batchesFromDb.length === 0 && totalTransactions === 0) {
      console.log("Inside zero-data condition! Calling nested counts...");
      const [settlementsCount, matchesCount, exceptionsCount] = await Promise.all([
        db.settlement.count(),
        db.match.count(),
        db.exception.count(),
      ]);
      console.log("Nested counts: settlements:", settlementsCount, "matches:", matchesCount, "exceptions:", exceptionsCount);
      console.log("Zero-data screen logic executed successfully!");
      return;
    }

    console.log("Continuing execution for populated dashboard...");
    const matchedTransactions = dashboardStats.totalMatched;
    const exactMatches = matchedTransactions;
    const feeAdjustments = batchesFromDb.reduce((sum: any, b: any) => sum + b._count.exceptions, 0);
    const amountMismatches = 0;
    const missingSettlements = dashboardStats.totalExceptions;
    const confirmedAmount = Number(confirmedAmountAggregate._sum.amount || 0);

    console.log("Calling generateReconciliationSummary...");
    const aiSummary = await generateReconciliationSummary({
      totalTransactions,
      matchedTransactions,
      exactMatches,
      feeAdjustments,
      amountMismatches,
      missingSettlements,
      confirmedAmount,
    });
    console.log("aiSummary fetched successfully!");
  } catch (error) {
    console.error("CRITICAL RUNTIME ERROR:", error);
  }
}

main().catch(console.error);
