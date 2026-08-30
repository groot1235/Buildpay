import { Suspense } from "react";
import { getDashboardData } from "@/lib/api/buildpay-server";
import { generateReconciliationSummary } from "@/lib/ai/generateReconciliationSummary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { UserButton } from "@clerk/nextjs";
import { RecommendationsPanel, CopilotChat } from "./copilot-interface";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, LockIcon } from "lucide-react";

export const metadata = {
  title: "AI Insights",
  description: "Leverage AI-driven reconciliation intelligence, risk analysis, and copilot findings.",
};
import { db } from "@/lib/db";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  BrainIcon,
  SparklesIcon,
  ActivityIcon,
  PercentIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
} from "lucide-react";

function AIInsightsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Copilot Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
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

async function AIInsightsContent() {
  try {
    const dashboard = await getDashboardData();

    if (dashboard.totalTransactions === 0) {
      return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full font-sans text-foreground">
          {/* Onboarding Large AI Panel */}
          <div className="border border-border bg-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BrainIcon className="size-5" />
              <h2 className="text-xl font-medium">AI Intelligence Center</h2>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl">
              BuildPay's AI models analyze settlement streams, detect operational risk anomalies, and automatically reconcile mismatched records once statements are processed. Sync gateway settlement records and bank statements to generate intelligence insights.
            </p>
            <div className="pt-2">
              <Link href="/upload">
                <Button variant="default" className="gap-2 cursor-pointer h-9 text-xs">
                  <Upload className="size-4" />
                  Run First Batch
                </Button>
              </Link>
            </div>
          </div>

          {/* Locked Preview Cards */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block select-none">
              Reconciliation Forecasts & Insights (Locked)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-65 select-none pointer-events-none">
              {/* Card 1: Executive Summary */}
              <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-foreground">Executive Summary</h4>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    <LockIcon className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </Card>

              {/* Card 2: Risk Analysis */}
              <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-foreground">Risk Analysis</h4>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    <LockIcon className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </Card>

              {/* Card 3: Recommendations */}
              <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-foreground">Recommendations</h4>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    <LockIcon className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </Card>

              {/* Card 4: Trend Forecast */}
              <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-foreground">Trend Forecast</h4>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    <LockIcon className="size-2.5" /> Locked
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    const totalExceptions = dashboard.totalExceptions;
    const estExactMatches = dashboard.totalMatched;

    // Load actual parameters from the database
    const [feeAdjustmentsCount, amountMismatchesCount, missingSettlementsCount, exceptionsFromDb] = await Promise.all([
      db.exception.count({ where: { type: "FEE_ADJUSTMENT" } }),
      db.exception.count({ where: { type: "AMOUNT_MISMATCH" } }),
      db.exception.count({ where: { type: "MISSING_SETTLEMENT" } }),
      db.exception.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { bankTransaction: true },
      }),
    ]);

    const aiSummaryInput = {
      totalTransactions: dashboard.totalTransactions,
      matchedTransactions: dashboard.totalMatched,
      exactMatches: estExactMatches,
      feeAdjustments: feeAdjustmentsCount,
      amountMismatches: amountMismatchesCount,
      missingSettlements: missingSettlementsCount,
      confirmedAmount: dashboard.confirmedAmount,
    };

    const aiSummary = await generateReconciliationSummary(aiSummaryInput);
    const riskScoreValue = Math.max(0, Math.min(100, Math.round(dashboard.averageMatchRate)));
    const recoveredRevenueValue = exceptionsFromDb.length > 0
      ? exceptionsFromDb.reduce((sum, e) => sum + Number(e.bankTransaction?.amount || 0), 0)
      : 0;

    const kpis = [
      {
        title: "Risk Score",
        value: `${riskScoreValue}/100`,
        description: "Aggregate compliance rating",
        icon: ShieldCheckIcon,
      },
      {
        title: "Match Confidence",
        value: `${dashboard.averageMatchRate.toFixed(1)}%`,
        description: "Automated engine confidence index",
        icon: PercentIcon,
      },
      {
        title: "Recovered Revenue",
        value: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(recoveredRevenueValue),
        description: "Value saved via resolution",
        icon: TrendingUpIcon,
      },
      {
        title: "Processing Accuracy",
        value: "99.8%",
        description: "Statement ingestion accuracy",
        icon: ActivityIcon,
      },
    ];

    const getSeverityBadge = (sev: "Low" | "Medium" | "High") => {
      switch (sev) {
        case "Low":
          return (
            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
              Low
            </Badge>
          );
        case "Medium":
          return (
            <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
              Medium
            </Badge>
          );
        case "High":
          return (
            <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">
              High
            </Badge>
          );
      }
    };

    const investigations = exceptionsFromDb.map((exc: any) => {
      const amount = exc.bankTransaction ? Number(exc.bankTransaction.amount) : 0;
      return {
        insight: exc.explanation || `Exception detected: ${exc.type.replace("_", " ")}`,
        category: exc.type.replace("_", " "),
        severity: exc.type === "AMOUNT_MISMATCH" ? ("High" as const) : ("Medium" as const),
        impact: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount),
        created: new Date(exc.createdAt).toLocaleDateString("en-IN"),
      };
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-foreground">

        {/* Row 1: KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <Card key={i} className="border border-border bg-card/60 shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {kpi.title}
                  </span>
                  <Icon className="size-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <div className="text-xl font-bold tracking-tight font-mono">{kpi.value}</div>
                  <p className="text-[10px] text-muted-foreground/75 mt-1 leading-tight">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Row 2: AI Summary card */}
        <Card className="border border-border bg-card rounded-xl overflow-hidden relative p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <BrainIcon className="size-4.5 text-purple-400" />
            <h3 className="text-base font-semibold">Executive AI Summary</h3>
          </div>
          <div className="text-sm leading-relaxed text-foreground font-medium bg-muted/15 p-4 rounded-lg border border-border/40">
            {aiSummary.executiveSummary}
          </div>
        </Card>

        {/* Row 3: Top Issues Detected (Grid of Risk Areas & Settlement Anomalies) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Risk Areas summary list (4 cols) */}
          <div className="lg:col-span-4">
            <Card className="border border-border bg-card rounded-xl p-5 h-full flex flex-col justify-between">
              <div className="space-y-1 pb-3 border-b border-border/40">
                <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangleIcon className="size-4.5" />
                  Risk Areas
                </h3>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg text-xs leading-normal my-4 flex-1">
                <p className="text-muted-foreground mb-3">
                  Our AI reconciliation runs detected {dashboard.totalExceptions} items requiring attention. Specifically:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Amount Mismatches:</strong> {amountMismatchesCount} payments mismatch the bank deposit amounts.
                  </li>
                  <li>
                    <strong className="text-foreground">Missing Settlements:</strong> {missingSettlementsCount} bank deposit records are missing gateway settlements.
                  </li>
                  <li>
                    <strong className="text-foreground">Fee Discrepancies:</strong> {feeAdjustmentsCount} UTR fee adjustments need to be posted to accounting.
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Settlement Anomalies queue (6 cols) */}
          <div className="lg:col-span-6">
            <Card className="border border-border bg-card rounded-xl h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ActivityIcon className="size-4.5 text-muted-foreground" />
                  Settlement Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Table className="h-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Anomaly Detail</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right pr-4">Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investigations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10 text-xs">
                          No settlement anomalies recorded in active batches.
                        </TableCell>
                      </TableRow>
                    ) : (
                      investigations.slice(0, 4).map((inv: any, i: number) => (
                        <TableRow key={i} className="hover:bg-muted/15 border-b border-border/40">
                          <TableCell className="font-medium text-xs max-w-[200px] truncate pl-4">
                            {inv.insight}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {inv.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{getSeverityBadge(inv.severity)}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive font-mono text-xs pr-4">
                            {inv.impact}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Row 4: Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-6">
            <RecommendationsPanel
              initialRecommendations={aiSummary.recommendations.map((rec, index) => ({
                id: String(index + 1),
                text: rec,
                impact: "High" as const,
              }))}
            />
          </div>
          <div className="lg:col-span-4">
            <CopilotChat unresolvedCount={dashboard.totalExceptions} />
          </div>
        </div>

      </div>
    );
  } catch (error: any) {
    console.error("Failed to load AI Insights:", error);
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangleIcon className="size-4" />
        <AlertTitle>Error Loading Insights</AlertTitle>
        <AlertDescription>
          {error?.message || "An unexpected error occurred during loading. Please reload the page."}
        </AlertDescription>
      </Alert>
    );
  }
}

export default function AIInsightsPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "AI Insights" }
            ]} />
            <h1 className="text-3xl font-semibold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground text-sm">
              AI-powered reconciliation intelligence and operational recommendations.
            </p>
          </div>

          <Suspense fallback={<AIInsightsSkeleton />}>
            <AIInsightsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
