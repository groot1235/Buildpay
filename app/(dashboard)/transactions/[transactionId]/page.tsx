import { Suspense } from "react";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/src/components/search/global-search";
import Link from "next/link";
import {
  ArrowLeftRightIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  ChevronLeftIcon,
  CalendarIcon,
  LayersIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    transactionId: string;
  }>;
}

function TransactionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

async function TransactionDetailsContent({ transactionId }: { transactionId: string }) {
  try {
    const tx = await db.bankTransaction.findUnique({
      where: { id: transactionId },
      include: {
        batch: true,
        match: true,
        exceptions: true,
      },
    });

    if (!tx) {
      return (
        <Card className="max-w-md mx-auto text-center border-dashed">
          <CardHeader>
            <div className="mx-auto size-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
              <AlertTriangleIcon className="size-6 text-red-500" />
            </div>
            <CardTitle>Transaction Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We couldn't locate a transaction with the ID <code className="font-mono text-xs">{transactionId}</code>.
            </p>
            <Link href="/transactions">
              <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-semibold cursor-pointer mt-2">
                <ChevronLeftIcon className="size-4" />
                Back to Transactions
              </span>
            </Link>
          </CardContent>
        </Card>
      );
    }

    let status: "Matched" | "Exception" | "Pending" = "Pending";
    if (tx.match) {
      status = "Matched";
    } else if (tx.exceptions.length > 0) {
      status = "Exception";
    }

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "Matched":
          return (
            <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
              Matched
            </Badge>
          );
        case "Exception":
          return (
            <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
              Exception
            </Badge>
          );
        case "Pending":
        default:
          return <Badge variant="secondary">Pending</Badge>;
      }
    };

    return (
      <div className="space-y-6 max-w-3xl">
        {/* Navigation back link */}
        <Link href="/transactions">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium cursor-pointer">
            <ChevronLeftIcon className="size-4" />
            Back to Transactions
          </span>
        </Link>

        {/* Transaction Card */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ArrowLeftRightIcon className="size-5 text-primary" />
                Transaction details
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{tx.id}</p>
            </div>
            {getStatusBadge(status)}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference ID</span>
                <p className="font-mono text-sm">{tx.referenceId || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Amount</span>
                <p className="text-lg font-extrabold text-foreground">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(Number(tx.amount))}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Imported Batch</span>
                <p className="text-sm flex items-center gap-1.5">
                  <LayersIcon className="size-4 text-muted-foreground" />
                  <Link href={`/batches/${tx.batchId}`}>
                    <span className="text-primary hover:underline">{tx.batch.name}</span>
                  </Link>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Date</span>
                <p className="text-sm flex items-center gap-1.5">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span>{new Date(tx.transactionDate).toLocaleString("en-IN")}</span>
                </p>
              </div>

              {tx.description && (
                <div className="sm:col-span-2 space-y-1 pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                  <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/40 leading-relaxed">
                    {tx.description}
                  </p>
                </div>
              )}
            </div>

            {/* Related Match Info */}
            {tx.match && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-green-500 font-semibold text-sm">
                  <CheckCircle2Icon className="size-4" />
                  <span>Matched Record Association</span>
                </div>
                <div className="pl-6 text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">Match ID:</strong>{" "}
                    <span className="font-mono">{tx.match.id}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">Match Rule:</strong> {tx.match.ruleUsed}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <strong className="text-foreground">Match Score:</strong>
                    <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 text-[10px] py-0">
                      {(tx.match.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Related Exception Info */}
            {tx.exceptions.length > 0 && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                  <AlertTriangleIcon className="size-4 shrink-0" />
                  <span>Discrepancy Exception Details</span>
                </div>
                <div className="pl-6 text-xs text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Type:</strong>{" "}
                    <Badge variant="destructive" className="text-[10px] uppercase">
                      {tx.exceptions[0].type.replace("_", " ")}
                    </Badge>
                  </p>
                  <div className="bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg space-y-1 text-foreground leading-relaxed">
                    <span className="text-[10px] font-bold text-destructive uppercase">AI Diagnosis</span>
                    <p>{tx.exceptions[0].explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending State */}
            {!tx.match && tx.exceptions.length === 0 && (
              <div className="pt-4 border-t border-border/50 flex flex-col items-center justify-center text-center p-6 bg-muted/5 rounded-lg border border-dashed border-border/40">
                <HelpCircleIcon className="size-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs font-semibold text-foreground">Pending Reconciliation Match</span>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-sm">
                  This transaction does not have any linked matches or active exceptions. It is currently waiting for the next automated reconciliation sweep.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Failed to load transaction details:", error);
    return (
      <Card className="max-w-md mx-auto text-center border-dashed">
        <CardHeader>
          <div className="mx-auto size-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
            <AlertTriangleIcon className="size-6 text-red-500" />
          </div>
          <CardTitle>Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading transaction details.
          </p>
        </CardContent>
      </Card>
    );
  }
}

export default async function TransactionDetailPage(props: PageProps) {
  const { transactionId } = await props.params;

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* Mobile Sheet Trigger */}
            <MobileSidebar />
            <div className="font-bold text-lg tracking-tight md:hidden">
              BuildPay
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="font-semibold bg-muted text-muted-foreground">BP</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Details Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
          <Suspense fallback={<TransactionDetailsSkeleton />}>
            <TransactionDetailsContent transactionId={transactionId} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
