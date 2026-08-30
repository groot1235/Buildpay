import { Suspense } from "react";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { UserButton } from "@clerk/nextjs";
import { TransactionsManager } from "./manager";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

export const metadata = {
  title: "Transactions",
  description: "Examine parsed statement ledgers, filter by match states, and drill down on entries.",
};

function TransactionsSkeleton() {
  return (
    <div className="space-y-6 font-sans">
      {/* Filter Bar Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card p-4 rounded-xl border border-border">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>

      {/* Table Card Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-border last:border-0 flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

async function TransactionsContent() {
  try {
    const bankTransactions = await db.bankTransaction.findMany({
      orderBy: { transactionDate: "desc" },
      include: {
        batch: true,
        match: true,
        exceptions: true,
      },
    });

    const transactions = bankTransactions.map((tx) => {
      let status: "Matched" | "Exception" | "Pending" = "Pending";
      if (tx.match) {
        status = "Matched";
      } else if (tx.exceptions.length > 0) {
        status = "Exception";
      }

      return {
        id: tx.id,
        referenceId: tx.referenceId || "N/A",
        amount: Number(tx.amount),
        batchName: tx.batch.name,
        batchId: tx.batchId,
        status,
        createdAt: tx.transactionDate.toISOString(),
        description: tx.description || "No description provided",
        type: tx.transactionType,
        relatedMatch: tx.match
          ? {
              id: tx.match.id,
              confidence: tx.match.confidence,
              ruleUsed: tx.match.ruleUsed,
            }
          : null,
        relatedException:
          tx.exceptions.length > 0
            ? {
                type: tx.exceptions[0].type,
                explanation: tx.exceptions[0].explanation,
              }
            : null,
      };
    });

    return <TransactionsManager transactions={transactions} />;
  } catch (error) {
    console.error("Failed to load transactions:", error);
    return <TransactionsManager transactions={[]} />;
  }
}

export default function TransactionsPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Transactions Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Transactions" }
            ]} />
            <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm">
              Examine parsed statement ledgers, filter by match states, and drill down on entries.
            </p>
          </div>

          <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
