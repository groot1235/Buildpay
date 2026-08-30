import { Suspense } from "react";
import { db } from "@/lib/db";
import { getBatchesData } from "@/lib/api/buildpay-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { BatchFilters } from "./filters";
import { RowActions } from "./row-actions";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { UserButton } from "@clerk/nextjs";
import {
  AlertTriangleIcon,
  LayersIcon,
  PlusIcon,
  Upload,
  ArrowLeftRightIcon,
  SparklesIcon,
  RefreshCwIcon,
  Bell,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Reconciliation Batches",
  description: "Monitor and manage statement processing logs and matched ledgers.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

function BatchesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 bg-card rounded-xl border border-border flex items-center justify-between px-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-border last:border-0 flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 animate-pulse" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

async function BatchesContent({ search, status }: { search: string; status: string }) {
  try {
    // 1. Fetch batches via API client
    const apiBatches = await getBatchesData();

    if (apiBatches.length === 0) {
      return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full font-sans text-foreground">
          {/* Onboarding Empty State Hero */}
          <div className="border border-border bg-card rounded-xl p-8 text-center space-y-6">
            <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <LayersIcon className="size-6 text-primary" />
            </div>
            
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-medium text-foreground">Get started with reconciliation</h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Upload bank statements and sync gateway settlements to begin matching and auditing transaction flows.
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Link href="/upload">
                <Button variant="default" className="gap-2 cursor-pointer h-9 text-xs">
                  <Upload className="size-4" />
                  Upload Statement
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="gap-2 cursor-pointer h-9 text-xs bg-background border-border hover:bg-muted">
                  <RefreshCwIcon className="size-4" />
                  Sync Razorpay
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block select-none">
              Platform Features
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Automatic Matching",
                  desc: "Automatic parsing and settlement normalization matching schedules using rule engines.",
                  icon: ArrowLeftRightIcon,
                },
                {
                  title: "Exception Detection",
                  desc: "Flags mismatch entries, reference conflicts, duplicates, or missing settlement items instantly.",
                  icon: AlertTriangleIcon,
                },
                {
                  title: "AI Risk Analysis",
                  desc: "Generates instant executive analysis reviews, anomalies detection, and operational recommendations.",
                  icon: SparklesIcon,
                },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Card key={i} className="border border-border bg-card rounded-xl p-6 space-y-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border/40">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-normal">{feature.desc}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // 2. Fetch exceptions and confirmed amounts from database
    const batchDetails = await db.batch.findMany({
      where: { id: { in: apiBatches.map((b) => b.id) } },
      include: {
        _count: {
          select: { exceptions: true },
        },
        bankTransactions: {
          where: { match: { isNot: null } },
          select: { amount: true },
        },
      },
    });

    const detailsMap = new Map(
      batchDetails.map((b) => [
        b.id,
        {
          exceptionsCount: b._count.exceptions,
          confirmedAmount: b.bankTransactions.reduce(
            (sum, tx) => sum + Number(tx.amount),
            0
          ),
        },
      ])
    );

    // 3. Merge data
    let batches = apiBatches.map((b) => {
      const details = detailsMap.get(b.id) || { exceptionsCount: 0, confirmedAmount: 0 };
      return {
        ...b,
        exceptionsCount: details.exceptionsCount,
        confirmedAmount: details.confirmedAmount,
      };
    });

    // 4. Apply filters (status & search query)
    if (status && status !== "ALL") {
      batches = batches.filter(
        (b) => b.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search) {
      const query = search.toLowerCase();
      batches = batches.filter((b) => b.name.toLowerCase().includes(query));
    }

    const getStatusBadge = (s: string) => {
      switch (s) {
        case "COMPLETED":
          return (
            <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
              Completed
            </Badge>
          );
        case "PROCESSING":
          return (
            <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">
              Processing
            </Badge>
          );
        case "FAILED":
          return (
            <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
              Failed
            </Badge>
          );
        case "CREATED":
        default:
          return <Badge variant="secondary">Created</Badge>;
      }
    };

    const totalBatches = apiBatches.length;
    const processingBatches = apiBatches.filter((b) => b.status === "PROCESSING").length;
    const completedBatches = apiBatches.filter((b) => b.status === "COMPLETED").length;
    const exceptionsCountTotal = batches.reduce((sum, b) => sum + b.exceptionsCount, 0);

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Batches</span>
              <p className="text-2xl font-bold font-mono">{totalBatches}</p>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Processing</span>
              <p className="text-2xl font-bold text-primary font-mono">{processingBatches}</p>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider block">Completed</span>
              <p className="text-2xl font-bold text-green-500 font-mono">{completedBatches}</p>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Exceptions</span>
              <p className="text-2xl font-bold text-red-500 font-mono">{exceptionsCountTotal}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <BatchFilters />

        {/* Grid Cards Container */}
        {batches.length === 0 ? (
          <Card className="border border-border p-12 text-center rounded-xl bg-card/40">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center">
                <LayersIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">No reconciliation batches found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Start by importing a bank statement CSV file to create your first batch.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/upload" aria-label="Upload bank statement CSV">
                  <Button size="sm" className="gap-2 cursor-pointer">
                    <Upload className="size-4" />
                    Upload CSV
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <Card key={batch.id} className="relative border border-border bg-card/65 hover:border-primary/40 transition-all duration-300 rounded-xl group flex flex-col justify-between overflow-hidden shadow-sm">
                
                {/* Top content wrapper */}
                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Header: Name, Status, RowActions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <Link href={`/batches/${batch.id}`}>
                        <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate cursor-pointer leading-tight text-foreground">
                          {batch.name}
                        </h3>
                      </Link>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {new Date(batch.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(batch.status)}
                      <RowActions batchId={batch.id} />
                    </div>
                  </div>

                  {/* Match Rate Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Match Rate</span>
                      <span className="font-mono text-foreground">{batch.matchRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/65 rounded-full overflow-hidden w-full border border-border/10">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${batch.matchRate}%` }} 
                      />
                    </div>
                  </div>

                </div>

                {/* Bottom stats row */}
                <div className="border-t border-border/40 p-4 bg-muted/10 rounded-b-xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Transactions</span>
                    <span className="font-bold text-foreground font-mono">{batch.totalTransactions}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Exceptions</span>
                    <span className={cn(
                      "font-bold font-mono",
                      batch.exceptionsCount > 0 ? "text-destructive" : "text-green-500"
                    )}>
                      {batch.exceptionsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Confirmed</span>
                    <span className="font-bold text-foreground font-mono truncate block">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(batch.confirmedAmount)}
                    </span>
                  </div>
                </div>

              </Card>
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Showing {batches.length} of {batches.length} batches
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to load batches:", error);
    return (
      <Card className="border-destructive/50 max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="size-5" />
            <CardTitle className="text-lg font-semibold">Error Loading Batches</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unable to load dashboard data
          </p>
        </CardContent>
      </Card>
    );
  }
}

export default async function BatchesPage(props: PageProps) {
  const params = await props.searchParams;
  const search = params.search || "";
  const status = params.status || "ALL";

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Batches Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Reconciliation Batches" }
            ]} />
            <h1 className="text-3xl font-bold tracking-tight">Reconciliation Batches</h1>
            <p className="text-muted-foreground text-sm">
              Manage uploaded reconciliation batches and monitor processing status.
            </p>
          </div>

          <Suspense fallback={<BatchesTableSkeleton />}>
            <BatchesContent search={search} status={status} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
