-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PROCESSED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('VERIFIED', 'REVIEW_REQUIRED', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('MISSING_SETTLEMENT', 'AMOUNT_MISMATCH', 'REFUND', 'FEE_ADJUSTMENT', 'DUPLICATE_RECORD', 'AMBIGUOUS_MATCH');

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "razorpaySettlementId" TEXT NOT NULL,
    "transactionId" TEXT,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fee" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "status" "SettlementStatus" NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" "ConfidenceLevel" NOT NULL,
    "ruleUsed" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exception" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "bankTransactionId" TEXT,
    "settlementId" TEXT,
    "type" "ExceptionType" NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankTransaction_referenceId_idx" ON "BankTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "BankTransaction_amount_idx" ON "BankTransaction"("amount");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_razorpaySettlementId_key" ON "Settlement"("razorpaySettlementId");

-- CreateIndex
CREATE INDEX "Settlement_transactionId_idx" ON "Settlement"("transactionId");

-- CreateIndex
CREATE INDEX "Settlement_amount_idx" ON "Settlement"("amount");

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exception" ADD CONSTRAINT "Exception_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
