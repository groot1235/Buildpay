import { PrismaClient, BatchStatus, TransactionType, SettlementStatus } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import "dotenv/config";

// Setup WebSocket constructor for Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function getRefId(num: number): string {
  return `PAY_${String(num).padStart(4, "0")}`;
}

function getSettleId(num: number): string {
  return `SETTLE_${String(num).padStart(4, "0")}`;
}

function getRandomDateInLast30Days(index: number): Date {
  const baseDate = new Date("2026-08-25T12:00:00Z");
  const daysAgo = (index % 28) + 1;
  const hoursAgo = (index * 7) % 24;
  const minutesAgo = (index * 13) % 60;
  
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() - daysAgo);
  date.setHours(baseDate.getHours() - hoursAgo);
  date.setMinutes(baseDate.getMinutes() - minutesAgo);
  return date;
}

function getSettlementDate(txDate: Date, index: number): Date {
  const date = new Date(txDate);
  const hoursToAdd = (index % 12) + 2;
  date.setHours(date.getHours() + hoursToAdd);
  return date;
}

async function main() {
  console.log("Seed Started");

  // Delete existing data in the correct order to respect relations
  await prisma.match.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.batch.deleteMany();

  // Create exactly 1 Batch
  const batch = await prisma.batch.create({
    data: {
      name: "Demo August Reconciliation",
      bankName: "HDFC",
      status: BatchStatus.COMPLETED,
    },
  });
  console.log("Created Batch");

  const bankTransactionsData = [];
  const settlementsData = [];

  // Group 1: 40 Perfect Matches (1 to 40)
  for (let i = 1; i <= 40; i++) {
    const amount = (500 + (i * 123.45) % 8000).toFixed(2);
    const txDate = getRandomDateInLast30Days(i);
    const settleDate = getSettlementDate(txDate, i);
    const refId = getRefId(i);
    const settleId = getSettleId(i);

    bankTransactionsData.push({
      batchId: batch.id,
      transactionDate: txDate,
      referenceId: refId,
      description: "Razorpay Settlement",
      amount,
      transactionType: TransactionType.CREDIT,
      rawData: { referenceId: refId, amount, description: "Razorpay Settlement" },
    });

    settlementsData.push({
      razorpaySettlementId: settleId,
      transactionId: refId,
      settlementDate: settleDate,
      amount,
      fee: "0.00",
      tax: "0.00",
      status: SettlementStatus.PROCESSED,
      rawData: { settlementId: settleId, transactionId: refId, amount, fee: "0.00", tax: "0.00" },
    });
  }

  // Group 2: 5 Fee-Adjustment Transactions (41 to 45)
  for (let i = 41; i <= 45; i++) {
    const factor = i - 40;
    const sAmount = 1000 * factor;
    const fee = 50 * factor;
    const bAmount = sAmount - fee;

    const sAmountStr = sAmount.toFixed(2);
    const feeStr = fee.toFixed(2);
    const bAmountStr = bAmount.toFixed(2);

    const txDate = getRandomDateInLast30Days(i);
    const settleDate = getSettlementDate(txDate, i);
    const refId = getRefId(i);
    const settleId = getSettleId(i);

    bankTransactionsData.push({
      batchId: batch.id,
      transactionDate: txDate,
      referenceId: refId,
      description: "Razorpay Settlement",
      amount: bAmountStr,
      transactionType: TransactionType.CREDIT,
      rawData: { referenceId: refId, amount: bAmountStr, description: "Razorpay Settlement" },
    });

    settlementsData.push({
      razorpaySettlementId: settleId,
      transactionId: refId,
      settlementDate: settleDate,
      amount: sAmountStr,
      fee: feeStr,
      tax: "0.00",
      status: SettlementStatus.PROCESSED,
      rawData: { settlementId: settleId, transactionId: refId, amount: sAmountStr, fee: feeStr, tax: "0.00" },
    });
  }

  // Group 3: 3 Amount-Mismatch Transactions (46 to 48)
  for (let i = 46; i <= 48; i++) {
    const factor = i - 45;
    const sAmount = 2000 * factor;
    const bAmount = sAmount - 100;

    const sAmountStr = sAmount.toFixed(2);
    const bAmountStr = bAmount.toFixed(2);

    const txDate = getRandomDateInLast30Days(i);
    const settleDate = getSettlementDate(txDate, i);
    const refId = getRefId(i);
    const settleId = getSettleId(i);

    bankTransactionsData.push({
      batchId: batch.id,
      transactionDate: txDate,
      referenceId: refId,
      description: "Razorpay Settlement",
      amount: bAmountStr,
      transactionType: TransactionType.CREDIT,
      rawData: { referenceId: refId, amount: bAmountStr, description: "Razorpay Settlement" },
    });

    settlementsData.push({
      razorpaySettlementId: settleId,
      transactionId: refId,
      settlementDate: settleDate,
      amount: sAmountStr,
      fee: "0.00",
      tax: "0.00",
      status: SettlementStatus.PROCESSED,
      rawData: { settlementId: settleId, transactionId: refId, amount: sAmountStr, fee: "0.00", tax: "0.00" },
    });
  }

  // Group 4: 2 Missing-Settlement Transactions (49 to 50)
  for (let i = 49; i <= 50; i++) {
    const factor = i - 48;
    const bAmount = 1500 * factor;
    const bAmountStr = bAmount.toFixed(2);

    const txDate = getRandomDateInLast30Days(i);
    const refId = getRefId(i);

    bankTransactionsData.push({
      batchId: batch.id,
      transactionDate: txDate,
      referenceId: refId,
      description: "Razorpay Settlement",
      amount: bAmountStr,
      transactionType: TransactionType.CREDIT,
      rawData: { referenceId: refId, amount: bAmountStr, description: "Razorpay Settlement" },
    });
  }

  // Create Bank Transactions
  for (const tx of bankTransactionsData) {
    await prisma.bankTransaction.create({ data: tx });
  }
  console.log("Created 50 Bank Transactions");

  // Create Settlements
  for (const st of settlementsData) {
    await prisma.settlement.create({ data: st });
  }
  console.log("Created 48 Settlements");

  console.log("Seed Complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
