import { db } from "@/lib/db";
import { ConfidenceLevel, ExceptionType, BatchStatus, Prisma } from "@prisma/client";

export interface ReconciliationReport {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  matchRate: number;
  exactMatches: number;
  feeAdjustments: number;
  amountMismatches: number;
  missingSettlements: number;
  confirmedAmount: number;
}

export async function reconcileBatch(batchId: string): Promise<ReconciliationReport> {
  // 1. Mark batch as PROCESSING atomically.
  const batch = await db.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new Error(`Batch with ID "${batchId}" not found.`);
  }

  await db.batch.update({
    where: { id: batchId },
    data: { status: BatchStatus.PROCESSING },
  });

  try {
    // 2. Load all BankTransaction records for the batch
    const transactions = await db.bankTransaction.findMany({
      where: { batchId },
    });

    // 3. Load matching / candidate Settlement records
    const referenceIds = transactions
      .map((t) => t.referenceId)
      .filter((ref): ref is string => typeof ref === "string" && ref.trim() !== "");

    const uniqueAmounts = Array.from(new Set(transactions.map((t) => t.amount)));

    // Fetch settlements by reference ID OR matching amount
    const rawSettlements = await db.settlement.findMany({
      where: {
        OR: [
          referenceIds.length > 0 ? { transactionId: { in: referenceIds } } : {},
          uniqueAmounts.length > 0 ? { amount: { in: uniqueAmounts } } : {},
        ],
      },
    });

    // Exclude settlements already matched by other batches to prevent Unique Constraint violations
    const otherMatches = await db.match.findMany({
      where: { batchId: { not: batchId } },
      select: { settlementId: true },
    });
    const alreadyMatchedSet = new Set(otherMatches.map((m) => m.settlementId));

    const settlements = rawSettlements.filter((s) => !alreadyMatchedSet.has(s.id));

    let exactMatches = 0;
    let feeAdjustments = 0;
    let amountMismatches = 0;
    let missingSettlements = 0;
    
    // Store confirmed amount as a Decimal to avoid float errors
    let confirmedAmountDecimal = new Prisma.Decimal(0);

    const matchesToCreate: {
      batchId: string;
      bankTransactionId: string;
      settlementId: string;
      confidence: number;
      confidenceLevel: ConfidenceLevel;
      ruleUsed: string;
      explanation: string;
    }[] = [];

    const exceptionsToCreate: {
      batchId: string;
      bankTransactionId: string | null;
      settlementId: string | null;
      type: ExceptionType;
      explanation: string;
    }[] = [];

    const matchedSettlementIds = new Set<string>();

    // Date tolerance configuration: 3 days in milliseconds
    const DATE_TOLERANCE_MS = 3 * 24 * 60 * 60 * 1000;

    for (const bank of transactions) {
      const refId = bank.referenceId;
      const bankAmt = bank.amount; // Prisma.Decimal
      const bankDate = new Date(bank.transactionDate).getTime();

      let matched = false;

      // STEP A: Try to match by reference ID
      if (refId && refId.trim() !== "") {
        const settlement = settlements.find(
          (s) => s.transactionId === refId && !matchedSettlementIds.has(s.id)
        );

        if (settlement) {
          matched = true;
          matchedSettlementIds.add(settlement.id);
          const settleAmt = settlement.amount;
          const fee = settlement.fee ? settlement.fee : new Prisma.Decimal(0);

          if (bankAmt.equals(settleAmt)) {
            exactMatches++;
            confirmedAmountDecimal = confirmedAmountDecimal.plus(bankAmt);
            matchesToCreate.push({
              batchId,
              bankTransactionId: bank.id,
              settlementId: settlement.id,
              confidence: 1.0,
              confidenceLevel: ConfidenceLevel.VERIFIED,
              ruleUsed: "EXACT_MATCH_REF",
              explanation: `Reference matches (${refId}) and amount is identical (${bankAmt.toString()}).`,
            });
          } else if (bankAmt.plus(fee).equals(settleAmt)) {
            feeAdjustments++;
            confirmedAmountDecimal = confirmedAmountDecimal.plus(bankAmt);
            matchesToCreate.push({
              batchId,
              bankTransactionId: bank.id,
              settlementId: settlement.id,
              confidence: 0.95,
              confidenceLevel: ConfidenceLevel.VERIFIED,
              ruleUsed: "FEE_ADJUSTMENT_REF",
              explanation: `Reference matches (${refId}) with fee adjustment: bank amount (${bankAmt.toString()}) + fee (${fee.toString()}) equals settlement (${settleAmt.toString()}).`,
            });
          } else {
            amountMismatches++;
            exceptionsToCreate.push({
              batchId,
              bankTransactionId: bank.id,
              settlementId: settlement.id,
              type: ExceptionType.AMOUNT_MISMATCH,
              explanation: `Amount mismatch on reference ID ${refId}: bank amount is ${bankAmt.toString()}, settlement amount is ${settleAmt.toString()}.`,
            });
          }
        }
      }

      // STEP B: If not matched, try to match by amount + date within tolerance
      if (!matched) {
        // Find all unmatched settlements with identical amount and date within tolerance
        const candidates = settlements.filter((s) => {
          if (matchedSettlementIds.has(s.id)) return false;
          if (!s.amount.equals(bankAmt)) return false;

          const settleDate = new Date(s.settlementDate).getTime();
          const diff = Math.abs(bankDate - settleDate);
          return diff <= DATE_TOLERANCE_MS;
        });

        if (candidates.length > 0) {
          // Sort candidates to find the one closest in date
          candidates.sort((a, b) => {
            const diffA = Math.abs(bankDate - new Date(a.settlementDate).getTime());
            const diffB = Math.abs(bankDate - new Date(b.settlementDate).getTime());
            return diffA - diffB;
          });

          const bestSettlement = candidates[0];
          matched = true;
          matchedSettlementIds.add(bestSettlement.id);
          exactMatches++;
          confirmedAmountDecimal = confirmedAmountDecimal.plus(bankAmt);

          matchesToCreate.push({
            batchId,
            bankTransactionId: bank.id,
            settlementId: bestSettlement.id,
            confidence: 0.85,
            confidenceLevel: ConfidenceLevel.REVIEW_REQUIRED,
            ruleUsed: "AMOUNT_DATE_MATCH",
            explanation: `Matched by amount (${bankAmt.toString()}) and date proximity (diff: ${Math.round(
              Math.abs(bankDate - new Date(bestSettlement.settlementDate).getTime()) / (1000 * 60 * 60)
            )} hours) within tolerance. Reference ID was omitted or did not match.`,
          });
        }
      }

      // STEP C: If still unmatched, it's a missing settlement exception
      if (!matched) {
        missingSettlements++;
        exceptionsToCreate.push({
          batchId,
          bankTransactionId: bank.id,
          settlementId: null,
          type: ExceptionType.MISSING_SETTLEMENT,
          explanation: refId
            ? `No matching settlement found for reference ID ${refId}.`
            : `Missing reference ID and no matching settlement by amount and date found within tolerance.`,
        });
      }
    }

    // 4. Save Match/Exception records and update status to COMPLETED inside a database transaction
    await db.$transaction(async (tx) => {
      // Clear old matches/exceptions
      await tx.match.deleteMany({ where: { batchId } });
      await tx.exception.deleteMany({ where: { batchId } });

      if (matchesToCreate.length > 0) {
        await tx.match.createMany({ data: matchesToCreate });
      }

      if (exceptionsToCreate.length > 0) {
        await tx.exception.createMany({ data: exceptionsToCreate });
      }

      await tx.batch.update({
        where: { id: batchId },
        data: { status: BatchStatus.COMPLETED },
      });
    });

    const totalTransactions = transactions.length;
    const matchedTransactions = matchesToCreate.length;
    const unmatchedTransactions = totalTransactions - matchedTransactions;
    const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

    return {
      totalTransactions,
      matchedTransactions,
      unmatchedTransactions,
      matchRate,
      exactMatches,
      feeAdjustments,
      amountMismatches,
      missingSettlements,
      confirmedAmount: confirmedAmountDecimal.toNumber(),
    };
  } catch (error) {
    // 5. Fallback lifecycle: Set to FAILED on exception
    console.error(`Reconciliation failed for batch ${batchId}:`, error);
    await db.batch.update({
      where: { id: batchId },
      data: { status: BatchStatus.FAILED },
    }).catch(console.error);

    throw error;
  }
}
