import { db } from "@/lib/db";
import { ReportsClient } from "./reports-client";

export const metadata = {
  title: "Reports",
  description: "Executive reporting overview of reconciliation volume and anomalies.",
};

export default async function ReportsPage() {
  const [transactions, matches, exceptions] = await Promise.all([
    db.bankTransaction.findMany({
      orderBy: { transactionDate: "asc" },
      select: {
        id: true,
        amount: true,
        transactionDate: true,
      },
    }),
    db.match.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        bankTransaction: {
          select: {
            amount: true,
          },
        },
      },
    }),
    db.exception.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    }),
  ]);

  // Map and serialize decimal and date types
  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    date: t.transactionDate.toISOString(),
  }));

  const serializedMatches = matches.map((m) => ({
    id: m.id,
    amount: Number(m.bankTransaction.amount),
    date: m.createdAt.toISOString(),
  }));

  const serializedExceptions = exceptions.map((e) => ({
    id: e.id,
    type: e.type,
    date: e.createdAt.toISOString(),
  }));

  return (
    <ReportsClient
      transactions={serializedTransactions}
      matches={serializedMatches}
      exceptions={serializedExceptions}
    />
  );
}
