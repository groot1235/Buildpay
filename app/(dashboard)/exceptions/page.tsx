import { Suspense } from "react";
import { db } from "@/lib/db";
import { explainException } from "@/lib/ai/explainException";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { UserButton } from "@clerk/nextjs";
import { ExceptionsManager } from "./manager";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

export const metadata = {
  title: "Exceptions",
  description: "Examine amount mismatches, resolve discrepancies, and apply AI recommendation actions.",
};

function ExceptionsSkeleton() {
  return (
    <div className="space-y-6">
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
          {Array.from({ length: 4 }).map((_, i) => (
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

      {/* AI Panel Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

async function ExceptionsContent() {
  try {
    const exceptionsFromDb = await db.exception.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        batch: true,
        bankTransaction: true,
        settlement: true,
      },
    });

    if (exceptionsFromDb.length === 0) {
      return <ExceptionsManager exceptions={[]} />;
    }

    // Resolve AI explanations concurrently (slice to avoid rate-limits/slow page-loads)
    const resolvedExceptions = await Promise.all(
      exceptionsFromDb.slice(0, 10).map(async (exc) => {
        let typeInput: "AMOUNT_MISMATCH" | "MISSING_SETTLEMENT" | "FEE_ADJUSTMENT" = "MISSING_SETTLEMENT";
        if (exc.type === "AMOUNT_MISMATCH" || exc.type === "FEE_ADJUSTMENT" || exc.type === "MISSING_SETTLEMENT") {
          typeInput = exc.type;
        }

        const analysis = await explainException({
          exceptionType: typeInput,
          bankAmount: exc.bankTransaction?.amount?.toString(),
          settlementAmount: exc.settlement?.amount?.toString(),
          fee: exc.settlement?.fee?.toString() || undefined,
          description: exc.bankTransaction?.description || undefined,
        });

        return {
          id: exc.id,
          batchName: exc.batch.name,
          type: exc.type,
          amount: Number(exc.bankTransaction?.amount || exc.settlement?.amount || 0),
          createdAt: exc.createdAt.toISOString(),
          explanation: analysis.explanation,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
        };
      })
    );

    const remainingExceptions = exceptionsFromDb.slice(10).map((exc) => ({
      id: exc.id,
      batchName: exc.batch.name,
      type: exc.type,
      amount: Number(exc.bankTransaction?.amount || exc.settlement?.amount || 0),
      createdAt: exc.createdAt.toISOString(),
      explanation: "Please review transaction manually.",
      recommendation: "Manually reconcile with payment records.",
      confidence: 0.5,
    }));

    const allExceptions = [...resolvedExceptions, ...remainingExceptions];

    return <ExceptionsManager exceptions={allExceptions} />;
  } catch (error) {
    console.error("Failed to load exceptions page contents:", error);
    return <ExceptionsManager exceptions={[]} />;
  }
}

export default function ExceptionsPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Exceptions" }
            ]} />
            <h1 className="text-3xl font-semibold tracking-tight">Exceptions</h1>
            <p className="text-muted-foreground text-sm">
              Review reconciliation issues requiring attention.
            </p>
          </div>

          <Suspense fallback={<ExceptionsSkeleton />}>
            <ExceptionsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
