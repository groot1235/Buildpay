import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getDashboardData } from "@/lib/api/buildpay-server";
import { currentUser } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit/log";
import { RazorpaySyncCard } from "./razorpay-sync-card";
import { generateReconciliationSummary } from "@/lib/ai/generateReconciliationSummary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserButton } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar } from "./sidebar";
import { RetryButton } from "./retry-button";
import { Progress } from "@/components/ui/progress";
import { MatchRateTrend } from "@/src/components/charts/match-rate-trend";
import { ExceptionBreakdown } from "@/src/components/charts/exception-breakdown";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeftRightIcon,
  AlertTriangleIcon,
  SparklesIcon,
  BrainIcon,
  BarChart3Icon,
  PieChartIcon,
  DollarSignIcon,
  PercentIcon,
  Upload,
  LayersIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  ArrowRightIcon,
  CircleIcon,
  ShieldAlertIcon,
  ActivityIcon,
  PlayIcon,
  TrendingUpIcon,
  Bell,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
  description: "Gain real-time operational insights, track auto-match rates, and resolve discrepancies.",
};

function DashboardBodySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardContent className="h-48" /></Card>
          <Card><CardContent className="h-48" /></Card>
        </div>
      </div>
    </div>
  );
}

async function DashboardBodyContent() {
  try {
    const dashboardStats = await getDashboardData();

    // Fetch last sync details
    const lastSyncRecord = await db.razorpaySync.findFirst({
      orderBy: { syncDate: "desc" },
    });

    const settlementVolume = await db.settlement.aggregate({
      _sum: { amount: true },
    });

    const isConnected = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== "placeholder");
    
    const lastSyncTime = lastSyncRecord
      ? new Date(lastSyncRecord.syncDate).toLocaleString("en-IN")
      : "Never";
    
    const volumeValue = Number(settlementVolume._sum.amount || 0);
    const recordsValue = lastSyncRecord ? lastSyncRecord.recordsCount : 0;
    const statusValue = lastSyncRecord ? lastSyncRecord.status : "NEVER";

    // Query batches and aggregated numbers from DB
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

    const totalTransactions = dashboardStats.totalTransactions;

    if (batchesFromDb.length === 0 && totalTransactions === 0) {
      return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full font-sans text-foreground">
          {/* 1. Hero Section (Large onboarding card) */}
          <Card className="border border-border bg-card rounded-xl p-6">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Connect Razorpay and Upload Bank Statements
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                BuildPay automatically reconciles settlements against bank transactions and highlights mismatches.
              </p>
              <div className="flex gap-3 pt-2">
                <Link href="/settings">
                  <Button variant="default" className="h-9 text-xs cursor-pointer px-4">
                    Connect Razorpay
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="outline" className="h-9 text-xs cursor-pointer px-4 border-border bg-background hover:bg-muted">
                    Upload Statement
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* 2. Setup Checklist & KPI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Setup Checklist (4 cols) */}
            <Card className="border border-border bg-card rounded-xl p-6 lg:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-medium border-b border-border/40 pb-3">Setup Checklist</h3>
                <div className="mt-4 space-y-4 text-sm">
                  {[
                    { label: "Connect Razorpay Account", completed: false },
                    { label: "Import Settlement Data", completed: false },
                    { label: "Upload First Bank Statement", completed: false },
                    { label: "Run First Reconciliation", completed: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="size-4 rounded border border-border flex items-center justify-center text-[10px] text-muted-foreground select-none font-bold">
                        {item.completed ? "✓" : ""}
                      </span>
                      <span className={item.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}>
                        {item.label}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground/60">
                        {item.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* KPI Cards (8 cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Total Transactions", value: "0", desc: "No transactions imported" },
                { title: "Matched", value: "0", desc: "Awaiting reconciliation" },
                { title: "Exceptions", value: "0", desc: "No exceptions found" },
                { title: "Settlement Volume", value: "₹0", desc: "No settlement data" },
              ].map((card, i) => (
                <Card key={i} className="border border-border bg-card rounded-xl p-6 flex flex-col justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                  <div className="mt-4">
                    <span className="text-3xl font-mono font-bold tabular-nums text-foreground">{card.value}</span>
                    <p className="text-xs text-muted-foreground/75 mt-1.5 leading-none">{card.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 3. Analytics Section Chart Placeholder */}
          <Card className="border border-border bg-card rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-4 mb-4 gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">No reconciliation activity yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a bank statement and sync Razorpay settlements to generate reconciliation insights.
                </p>
              </div>
            </div>

            {/* Chart Skeleton */}
            <div className="h-64 flex flex-col justify-between pt-4">
              <div className="flex-1 flex items-end justify-between gap-3 px-4">
                {[40, 20, 60, 30, 80, 50, 90, 45, 70, 35, 85, 40].map((height, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/40 w-full rounded-t border border-border/30 border-b-0 animate-pulse"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="border-t border-border mt-3 pt-3 flex justify-between text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                <span>AUG 01</span>
                <span>AUG 10</span>
                <span>AUG 20</span>
                <span>AUG 30</span>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    const matchedTransactions = dashboardStats.totalMatched;
    const exactMatches = matchedTransactions; // Assuming matches equal verified
    const feeAdjustments = batchesFromDb.reduce((sum, b) => sum + b._count.exceptions, 0);
    const amountMismatches = 0; // Defaulting
    const missingSettlements = dashboardStats.totalExceptions;

    const confirmedAmount = Number(confirmedAmountAggregate._sum.amount || 0);

    // Call AI Summary with gathered database counts
    const aiSummaryInput = {
      totalTransactions,
      matchedTransactions,
      exactMatches,
      feeAdjustments,
      amountMismatches,
      missingSettlements,
      confirmedAmount,
    };

    const aiSummary = batchesFromDb.length === 0
      ? {
          executiveSummary: "No reconciliation data available. Complete a reconciliation run to generate AI insights.",
          riskLevel: "LOW" as const,
          riskAreas: [],
          recommendations: [],
        }
      : await generateReconciliationSummary(aiSummaryInput);

    const recentBatches = batchesFromDb.map((batch) => {
      const totalTxs = batch._count.bankTransactions;
      const matchedTxs = batch._count.matches;
      const matchRate = totalTxs > 0 ? (matchedTxs / totalTxs) * 100 : 0;
      const exceptionsCount = batch._count.exceptions;
      
      const amount = batch.bankTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );

      return {
        id: batch.id,
        name: batch.name,
        status: batch.status,
        matchRate,
        exceptionsCount,
        confirmedAmount: amount,
      };
    });    const kpiStats = [
      {
        title: "Transactions",
        value: dashboardStats.totalTransactions.toLocaleString(),
        description: "Processed bank transactions",
        trend: "+12.4%",
        trendType: "up",
        icon: ArrowLeftRightIcon,
      },
      {
        title: "Match Rate",
        value: `${dashboardStats.averageMatchRate.toFixed(1)}%`,
        description: "Auto-matched settlements",
        trend: "+0.8%",
        trendType: "up",
        icon: PercentIcon,
      },
      {
        title: "Exceptions",
        value: dashboardStats.totalExceptions.toLocaleString(),
        description: "Discrepancies identified",
        trend: "-3.2%",
        trendType: "down",
        icon: AlertTriangleIcon,
      },
      {
        title: "Reconciled Amount",
        value: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }).format(dashboardStats.confirmedAmount),
        description: "Confirmed financial volume",
        trend: "+8.3%",
        trendType: "up",
        icon: DollarSignIcon,
      },
    ];

    const getRiskBadge = (level: "LOW" | "MEDIUM" | "HIGH") => {
      switch (level) {
        case "LOW":
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Low Risk</span>;
        case "MEDIUM":
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Medium Risk</span>;
        case "HIGH":
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">High Risk</span>;
        default:
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground border border-border">Unknown</span>;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "COMPLETED":
          return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">Completed</span>;
        case "PROCESSING":
          return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Processing</span>;
        case "FAILED":
          return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">Failed</span>;
        case "CREATED":
        default:
          return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border">Created</span>;
      }
    };

    return (
      <div className="max-w-7xl mx-auto w-full space-y-6 font-sans">
        
        {/* 1. Top Row: 4 KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="border border-border bg-card shadow-xs rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight font-mono" style={{ fontFeatureSettings: '"tnum"' }}>{stat.value}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    stat.trendType === "up" 
                      ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border border-red-500/20"
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-none">{stat.description}</p>
              </Card>
            );
          })}
        </div>

        {/* 2. Second Row: 8 columns Operational Analytics, 4 columns Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Operational Analytics (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Operational Analytics</h3>
                  <p className="text-sm text-muted-foreground">Reconciliation engine auto-match performance trend.</p>
                </div>
                {/* 7D / 30D / 90D filters */}
                <div className="flex items-center gap-1.5 bg-muted/30 p-0.5 rounded-lg border border-border/40">
                  {["7D", "30D", "90D"].map((filter) => (
                    <Button
                      key={filter}
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2.5 text-xs rounded-md ${
                        filter === "30D"
                          ? "bg-background shadow-xs text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="h-64 pt-2">
                <MatchRateTrend />
              </div>
            </Card>
          </div>

          {/* Activity Feed (4 cols) */}
          <div className="lg:col-span-4">
            <Card className="border border-border bg-card rounded-xl p-6 h-full flex flex-col">
              <div className="pb-4 border-b border-border/40">
                <h3 className="text-xl font-semibold">Activity Feed</h3>
                <p className="text-sm text-muted-foreground">Real-time ledger events.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pt-4 space-y-4 max-h-[268px]">
                {/* Recent uploads, sync events, exception alerts */}
                <div className="space-y-4 text-xs">
                  <div className="flex gap-3">
                    <div className="size-6 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Upload className="size-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Statement Upload Completed</p>
                      <p className="text-muted-foreground">Normalized bank statement containing {totalTransactions} entries.</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono" style={{ fontFeatureSettings: '"tnum"' }}>2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="size-6 rounded bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCwIcon className="size-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Razorpay API Synchronization</p>
                      <p className="text-muted-foreground">Successfully imported settlement schedules from merchant mid_razorpay_9823.</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono" style={{ fontFeatureSettings: '"tnum"' }}>3 hours ago</p>
                    </div>
                  </div>

                  {dashboardStats.totalExceptions > 0 && (
                    <div className="flex gap-3">
                      <div className="size-6 rounded bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangleIcon className="size-3" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Exception Warnings Triggered</p>
                        <p className="text-muted-foreground">{dashboardStats.totalExceptions} transaction exceptions flags need reviewer confirmation.</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono" style={{ fontFeatureSettings: '"tnum"' }}>3 hours ago</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* 3. Third Row: Recent Batches Table */}
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader className="pb-4 border-b border-border/40 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Reconciliation Batches</CardTitle>
              <p className="text-sm text-muted-foreground">Historical run audits matching rates.</p>
            </div>
            <Link href="/batches">
              <Button variant="outline" size="sm" className="h-8 text-xs border-border bg-background hover:bg-muted cursor-pointer">
                View All Batches
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/10 sticky top-0">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="pl-6 h-10 text-xs font-semibold">Batch Name</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Status</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Match Rate</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Exceptions</TableHead>
                    <TableHead className="text-right pr-6 h-10 text-xs font-semibold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
                        No batches loaded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentBatches.slice(0, 5).map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-muted/10 transition-colors border-b border-border/30">
                        <TableCell className="font-medium pl-6 py-3.5">
                          <Link href={`/batches/${batch.id}`}>
                            <span className="text-foreground hover:underline cursor-pointer font-semibold text-sm">{batch.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-3.5">
                          {getStatusBadge(batch.status)}
                        </TableCell>
                        <TableCell className="font-mono text-xs py-3.5" style={{ fontFeatureSettings: '"tnum"' }}>
                          {batch.matchRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="font-mono text-xs py-3.5" style={{ fontFeatureSettings: '"tnum"' }}>
                          {batch.exceptionsCount}
                        </TableCell>
                        <TableCell className="text-right font-semibold pr-6 py-3.5 font-mono text-xs" style={{ fontFeatureSettings: '"tnum"' }}>
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(batch.confirmedAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 4. Fourth Row: AI Reconciliation Summary */}
        <Card className="border border-border bg-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <BrainIcon className="size-4.5 text-purple-400" />
              <h3 className="text-xl font-semibold">AI Reconciliation Summary</h3>
            </div>
            {getRiskBadge(aiSummary.riskLevel)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm leading-relaxed text-muted-foreground">
            {/* Executive Summary (2 cols) */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Executive Summary</span>
              <p className="text-foreground font-medium leading-relaxed bg-muted/15 p-4 rounded-xl border border-border/40">
                {aiSummary.executiveSummary}
              </p>
            </div>
            
            {/* Recommendations (1 col) */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Recommendations</span>
              {aiSummary.recommendations.length === 0 ? (
                <p className="text-muted-foreground text-xs leading-normal">All parameters are healthy. No immediate operational actions required.</p>
              ) : (
                <ul className="space-y-2">
                  {aiSummary.recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/90 text-xs leading-normal">
                      <SparklesIcon className="size-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="flex items-center justify-center p-6 min-h-[400px]">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="size-5" />
              <CardTitle className="text-lg font-semibold">Error Loading Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unable to load dashboard data
            </p>
            <div className="flex justify-end">
              <RetryButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (clerkUser) {
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "admin@buildpay.co";
    const userName = clerkUser.fullName || "Admin User";

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentLogin = db.auditLog
      ? await db.auditLog.findFirst({
          where: {
            action: "LOGIN",
            userEmail,
            createdAt: { gte: fifteenMinutesAgo },
          },
        })
      : null;

    if (db.auditLog && !recentLogin) {
      await logAudit({
        action: "LOGIN",
        userEmail,
        userName,
        entityType: "USER",
        entityId: clerkUser.id,
        entityName: userName,
      });
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Dashboard Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1">
            <BreadcrumbNav items={[{ label: "Dashboard" }]} />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of automated bank statement reconciliation metrics.
            </p>
          </div>

          <Suspense fallback={<DashboardBodySkeleton />}>
            <DashboardBodyContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
