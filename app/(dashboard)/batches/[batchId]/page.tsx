import { Suspense } from "react";
import { getBatchDetailsData } from "@/lib/api/buildpay-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { UserButton } from "@clerk/nextjs";
import { GlobalSearch } from "@/src/components/search/global-search";
import { WorkspaceManager } from "./workspace-manager";
import { AlertTriangleIcon, ChevronLeftIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export async function generateMetadata(props: PageProps) {
  const { batchId } = await props.params;
  try {
    const details = await getBatchDetailsData(batchId);
    return {
      title: details?.batch?.name || "Batch Workspace",
      description: `Run AI reconciliation sweeps and review exceptions for batch: ${details?.batch?.name || batchId}.`,
    };
  } catch {
    return {
      title: "Batch Workspace",
      description: "Run AI reconciliation sweeps and review exceptions.",
    };
  }
}

function BatchDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 animate-pulse bg-muted/60" />
          <Skeleton className="h-4 w-40 animate-pulse bg-muted/60" />
        </div>
        <Skeleton className="h-9 w-48 animate-pulse bg-muted/60" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-20 animate-pulse bg-muted/60" />
              <Skeleton className="h-8 w-24 animate-pulse bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Content Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-80 animate-pulse bg-muted/60" />
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full animate-pulse bg-muted/60" />
            <Skeleton className="h-6 w-full animate-pulse bg-muted/60" />
            <Skeleton className="h-6 w-2/3 animate-pulse bg-muted/60" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function BatchDetailsContent({ batchId }: { batchId: string }) {
  try {
    const details = await getBatchDetailsData(batchId);

    if (!details || !details.batch) {
      return <BatchNotFound batchId={batchId} />;
    }

    return <WorkspaceManager batchId={batchId} initialDetails={details} />;
  } catch (error) {
    console.error("Failed to load batch details:", error);
    return <BatchNotFound batchId={batchId} />;
  }
}

function BatchNotFound({ batchId }: { batchId: string }) {
  return (
    <Card className="max-w-md mx-auto text-center border-dashed border-border p-6 space-y-4">
      <CardHeader>
        <div className="mx-auto size-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
          <AlertTriangleIcon className="size-6 text-red-500" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">Batch not found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The requested reconciliation batch with ID <code className="font-mono text-xs select-all bg-muted/30 px-1 py-0.5 rounded">{batchId}</code> could not be located.
        </p>
        <Link href="/batches">
          <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-semibold cursor-pointer">
            <ChevronLeftIcon className="size-4" />
            Back to Batches
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function BatchDetailPage(props: PageProps) {
  const { batchId } = await props.params;

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
            <Link href="/upload" aria-label="Upload bank statement CSV">
              <Button variant="default" size="sm" className="gap-2 shrink-0 cursor-pointer">
                <Upload className="size-4" />
                <span className="hidden md:inline">Upload CSV</span>
              </Button>
            </Link>
            <UserButton />
          </div>
        </header>

        {/* Details Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
          <Suspense fallback={<BatchDetailsSkeleton />}>
            <BatchDetailsContent batchId={batchId} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
