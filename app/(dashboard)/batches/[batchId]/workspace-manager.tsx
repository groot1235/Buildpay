"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import Link from "next/link";
import {
  PlayIcon,
  DownloadIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ActivityIcon,
  PercentIcon,
  DollarSignIcon,
  CalendarIcon,
  LayersIcon,
  BrainIcon,
  SparklesIcon,
  MoreVerticalIcon,
  InfoIcon,
  ClockIcon,
  UserIcon,
  Loader2Icon,
  Upload,
} from "lucide-react";
import { reconcileBatch, getBatch, getBatchReport, BatchDetails } from "@/lib/api/buildpay";

interface WorkspaceManagerProps {
  batchId: string;
  initialDetails: BatchDetails;
}

interface RunLog {
  event: string;
  timestamp: string;
  status: "started" | "processing" | "completed" | "failed";
}

export function WorkspaceManager({ batchId, initialDetails }: WorkspaceManagerProps) {
  const router = useRouter();
  const [details, setDetails] = React.useState<BatchDetails>(initialDetails);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);

  // Reconciliation execution state
  const [isReconciling, setIsReconciling] = React.useState(false);
  const [reconcileProgress, setReconcileProgress] = React.useState(0);
  const [currentStage, setCurrentStage] = React.useState("Loading Transactions");

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Session-based run logs for recent activity feed
  const [runLogs, setRunLogs] = React.useState<RunLog[]>([]);

  // Exception analysis sheet state
  const [selectedException, setSelectedException] = React.useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Sync data on initialDetails change
  React.useEffect(() => {
    setDetails(initialDetails);
  }, [initialDetails]);

  // Set stages according to progress percentage
  React.useEffect(() => {
    if (reconcileProgress < 30) {
      setCurrentStage("Loading Transactions");
    } else if (reconcileProgress < 60) {
      setCurrentStage("Matching Records");
    } else if (reconcileProgress < 80) {
      setCurrentStage("Detecting Exceptions");
    } else if (reconcileProgress < 95) {
      setCurrentStage("Generating Summary");
    } else {
      setCurrentStage("Finalizing Results");
    }
  }, [reconcileProgress]);

  // Actions
  const startReconciliationFlow = () => {
    setIsAlertOpen(true);
  };

  const triggerReconciliation = async () => {
    setIsAlertOpen(false);
    setIsReconciling(true);
    setReconcileProgress(5);

    const now = new Date().toLocaleTimeString("en-IN");
    setRunLogs((prev) => [
      { event: "Reconciliation run started", timestamp: now, status: "started" },
      ...prev,
    ]);

    // Animate execution stages
    const interval = setInterval(() => {
      setReconcileProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 120);

    try {
      const res = await reconcileBatch(batchId);

      if (res.success) {
        setReconcileProgress(100);
        clearInterval(interval);

        // Fetch updated data from API directly for instant UI state update
        const updatedDetails = await getBatch(batchId);
        setDetails(updatedDetails);

        const endNow = new Date().toLocaleTimeString("en-IN");
        setRunLogs((prev) => [
          { event: "Reconciliation completed", timestamp: endNow, status: "completed" },
          ...prev,
        ]);

        toast.add({
          title: "Reconciliation Complete",
          description: "Batch successfully processed.",
          type: "success",
        });
      } else {
        throw new Error(res.error || "Failed engine execution");
      }
    } catch (err) {
      clearInterval(interval);
      const failNow = new Date().toLocaleTimeString("en-IN");
      setRunLogs((prev) => [
        { event: "Reconciliation failed", timestamp: failNow, status: "failed" },
        ...prev,
      ]);

      toast.add({
        title: "Reconciliation Failed",
        description: "Unable to complete reconciliation.",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setIsReconciling(false);
        router.refresh();
      }, 400);
    }
  };

  const exportToCSV = async () => {
    setIsDownloading(true);
    try {
      const report = await getBatchReport(batchId);
      
      let csvContent = "Reconciliation Summary\n";
      csvContent += `Batch ID,${batchId}\n`;
      csvContent += `Batch Name,${details.batch.name}\n`;
      csvContent += `Total Transactions,${report.summary.totalTransactions}\n`;
      csvContent += `Matched Transactions,${report.summary.matchedTransactions}\n`;
      csvContent += `Match Rate,${report.summary.matchRate.toFixed(2)}%\n`;
      csvContent += `Confirmed Amount,${report.summary.confirmedAmount}\n\n`;

      csvContent += "Matches\n";
      csvContent += "Match ID,Bank Transaction ID,Settlement ID,Confidence,Rule Used\n";
      for (const m of report.matches) {
        csvContent += `"${m.id}","${m.bankTransactionId}","${m.settlementId}",${m.confidence},"${m.ruleUsed}"\n`;
      }
      csvContent += "\nExceptions\n";
      csvContent += "Exception ID,Transaction ID,Type,Explanation\n";
      for (const e of report.exceptions) {
        csvContent += `"${e.id}","${e.bankTransactionId || ""}","${e.type}","${e.explanation.replace(/"/g, '""')}"\n`;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `batch-report-${batchId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.add({
        title: "Export Failed",
        description: "Failed to download CSV report.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const exportToPDF = async () => {
    setIsDownloading(true);
    try {
      const report = await getBatchReport(batchId);
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups to export PDF.");
      }

      const formattedConfirmedAmount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(report.summary.confirmedAmount);

      printWindow.document.write(`
        <html>
          <head>
            <title>BuildPay Reconciliation Report - ${details.batch.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; padding: 40px; line-height: 1.5; }
              .header { border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #09090b; }
              .header p { margin: 5px 0 0 0; font-size: 14px; color: #71717a; }
              .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; }
              .card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 15px; }
              .card span { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 5px; }
              .card p { margin: 0; font-size: 20px; font-weight: 700; color: #09090b; }
              .section-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; color: #09090b; page-break-after: avoid; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
              th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e4e4e7; }
              th { background-color: #f4f4f5; color: #71717a; font-weight: 600; }
              td { color: #27272a; word-break: break-all; }
              .font-mono { font-family: monospace; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>BuildPay Reconciliation Report</h1>
              <p>Batch: ${details.batch.name} (${batchId}) | Date: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
            
            <div class="grid">
              <div class="card">
                <span>Total Transactions</span>
                <p>${report.summary.totalTransactions}</p>
              </div>
              <div class="card">
                <span>Matched Transactions</span>
                <p>${report.summary.matchedTransactions}</p>
              </div>
              <div class="card">
                <span>Match Rate</span>
                <p>${report.summary.matchRate.toFixed(2)}%</p>
              </div>
              <div class="card">
                <span>Confirmed Amount</span>
                <p>${formattedConfirmedAmount}</p>
              </div>
            </div>

            <div class="section-title">Reconciliation Exceptions (${report.exceptions.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                ${report.exceptions.map(e => `
                  <tr>
                    <td class="font-mono">${e.id}</td>
                    <td class="font-mono">${e.bankTransactionId || "N/A"}</td>
                    <td><b>${e.type.replace("_", " ")}</b></td>
                    <td>${e.explanation}</td>
                  </tr>
                `).join("")}
                ${report.exceptions.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#71717a;">No exceptions found.</td></tr>' : ''}
              </tbody>
            </table>

            <div class="section-title">Reconciliation Matches (${report.matches.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Bank Transaction ID</th>
                  <th>Settlement ID</th>
                  <th>Confidence</th>
                  <th>Rule Used</th>
                </tr>
              </thead>
              <tbody>
                ${report.matches.map(m => `
                  <tr>
                    <td class="font-mono">${m.id}</td>
                    <td class="font-mono">${m.bankTransactionId}</td>
                    <td class="font-mono">${m.settlementId}</td>
                    <td>${(m.confidence * 100).toFixed(0)}%</td>
                    <td><code>${m.ruleUsed}</code></td>
                  </tr>
                `).join("")}
                ${report.matches.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#71717a;">No matches found.</td></tr>' : ''}
              </tbody>
            </table>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err: any) {
      console.error(err);
      toast.add({
        title: "Export Failed",
        description: err.message || "Failed to download PDF report.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updatedDetails = await getBatch(batchId);
      setDetails(updatedDetails);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Helper Badge Renderers
  const getBatchStatusBadge = (s: string) => {
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

  const getConfidenceBadge = (confidence: number) => {
    const percent = confidence * 100;
    if (percent >= 90) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
          High ({percent.toFixed(0)}%)
        </Badge>
      );
    } else if (percent >= 75) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
          Medium ({percent.toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
          Low ({percent.toFixed(0)}%)
        </Badge>
      );
    }
  };

  // Compute status mappings for bank transactions table
  const enrichedTransactions = React.useMemo(() => {
    return details.transactions.map((tx) => {
      const match = details.matches.find((m) => m.bankTransactionId === tx.id);
      const exception = details.exceptions.find((e) => e.bankTransactionId === tx.id);

      let status: "Matched" | "Unmatched" | "Review Required" = "Unmatched";
      let confidence = 0;
      if (match) {
        status = "Matched";
        confidence = match.confidence;
      } else if (exception) {
        status = "Review Required";
      }

      return {
        ...tx,
        status,
        confidence,
      };
    });
  }, [details]);

  // Compute Exception Details
  const exceptionRows = React.useMemo(() => {
    return details.exceptions.map((exc) => {
      const tx = details.transactions.find((t) => t.id === exc.bankTransactionId);
      
      let expected = 0;
      let actual = tx ? Number(tx.amount) : 0;
      
      if (exc.type === "AMOUNT_MISMATCH") {
        const matchExpected = exc.explanation.match(/settlement amount is ([0-9.]+)/);
        if (matchExpected) expected = parseFloat(matchExpected[1]);
      } else if (exc.type === "MISSING_SETTLEMENT") {
        expected = 0;
      }
      
      const difference = expected - actual;
      const confidence = exc.type === "AMOUNT_MISMATCH" ? 0.5 : 0.0;

      return {
        ...exc,
        txDescription: tx?.description || tx?.referenceId || "Bank Transaction",
        expected,
        actual,
        difference,
        confidence,
      };
    });
  }, [details]);

  // Compute Matched Details
  const matchedRows = React.useMemo(() => {
    return details.matches.map((m) => {
      const tx = details.transactions.find((t) => t.id === m.bankTransactionId);
      return {
        ...m,
        txDescription: tx?.description || tx?.referenceId || "Bank Transaction",
        amount: tx ? Number(tx.amount) : 0,
      };
    });
  }, [details]);

  // Mock timeline audit logs
  const auditLogs = React.useMemo(() => {
    const baseTime = new Date(details.batch.createdAt).getTime();
    return [
      {
        event: "Batch Created",
        actor: "System",
        timestamp: new Date(baseTime).toLocaleString("en-IN"),
        description: `Batch initialized with name "${details.batch.name}"`,
      },
      {
        event: "Bank Statement Imported",
        actor: "System",
        timestamp: new Date(baseTime + 15000).toLocaleString("en-IN"),
        description: `Imported ${details.summary.totalTransactions} ledger statement records`,
      },
      {
        event: "Reconciliation Engine Triggered",
        actor: "AI Engine",
        timestamp: new Date(baseTime + 30000).toLocaleString("en-IN"),
        description: "Started match sweeps using current gateway metadata rules",
      },
      {
        event: `Auto-Matched ${details.summary.matchedTransactions} Transactions`,
        actor: "AI Engine",
        timestamp: new Date(baseTime + 45000).toLocaleString("en-IN"),
        description: `Reached match rate of ${details.summary.matchRate.toFixed(1)}%`,
      },
      ...(details.exceptions.length > 0
        ? [
            {
              event: `Logged ${details.exceptions.length} Critical Exceptions`,
              actor: "AI Analyst",
              timestamp: new Date(baseTime + 60000).toLocaleString("en-IN"),
              description: "Discrepancies identified: AMOUNT_MISMATCH, MISSING_SETTLEMENT",
            },
          ]
        : []),
    ];
  }, [details]);

  // Calculate average confidence of matches
  const averageConfidence = React.useMemo(() => {
    if (!details.matches || details.matches.length === 0) return 0;
    return (details.matches.reduce((sum, m) => sum + m.confidence, 0) / details.matches.length) * 100;
  }, [details.matches]);

  return (
    <div className="space-y-6">
      {/* 1. Header Information Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <BreadcrumbNav items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Reconciliation Batches", href: "/batches" },
            { label: details.batch.name }
          ]} />
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{details.batch.name}</h1>
            {getBatchStatusBadge(details.batch.status)}
          </div>
          <p className="text-xs text-muted-foreground flex gap-2 items-center flex-wrap select-none">
            <span>
              ID: <code className="font-mono bg-muted/40 px-1 py-0.5 rounded text-[11px] select-all">{batchId}</code>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              Created {new Date(details.batch.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={startReconciliationFlow}
            disabled={isReconciling || isRefreshing}
            className="gap-2 shrink-0"
          >
            {isReconciling ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            Run Analysis
          </Button>

          {details.summary.totalTransactions > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isDownloading || isReconciling}
                className="gap-2 shrink-0 cursor-pointer"
              >
                <DownloadIcon className="size-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={isDownloading || isReconciling}
                className="gap-2 shrink-0 cursor-pointer"
              >
                <DownloadIcon className="size-4" />
                Export PDF
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isReconciling}
            aria-label="Refresh batch details"
            className="shrink-0 border border-border/40 hover:bg-muted"
          >
            <RefreshCwIcon className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Reconciling visual feedback progress card */}
      {isReconciling && (
        <Card className="border-border bg-muted/5 animate-fade-in p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-2">
              <BrainIcon className="size-4 text-primary animate-pulse" />
              Reconciliation Running:{" "}
              <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                {currentStage}
              </Badge>
            </span>
            <span className="font-mono text-muted-foreground">{reconcileProgress}%</span>
          </div>
          <Progress value={reconcileProgress} />
        </Card>
      )}

      {/* 2. Overview Cards Area */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border border-border/80 bg-card/60 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <LayersIcon className="size-3.5" />
              Transactions
            </span>
            <p className="text-2xl font-bold font-mono">{details.summary.totalTransactions}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2Icon className="size-3.5" />
              Matched
            </span>
            <p className="text-2xl font-bold text-green-500 font-mono">{details.summary.matchedTransactions}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangleIcon className="size-3.5" />
              Exceptions
            </span>
            <p className="text-2xl font-bold text-red-500 font-mono">{details.exceptions.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSignIcon className="size-3.5" />
              Amount
            </span>
            <p className="text-2xl font-bold text-emerald-500 font-mono">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(details.summary.confirmedAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <PercentIcon className="size-3.5" />
              Confidence
            </span>
            <p className="text-2xl font-bold text-primary font-mono">{averageConfidence.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Primary Tabs Area */}
      {details.summary.totalTransactions === 0 ? (
        <Card className="border-dashed border-border p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4 my-8 bg-card">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <LayersIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-bold text-foreground">No transactions available in this batch</CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload a bank statement CSV or sync Razorpay to start reconciling records.
            </p>
          </div>
          <div className="flex gap-2.5 justify-center pt-2">
            <Link href="/upload">
              <Button size="sm" className="gap-2 cursor-pointer">
                <Upload className="size-4" />
                Upload CSV
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                <RefreshCwIcon className="size-4" />
                Sync Razorpay
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-muted/40 border border-border/60">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>

        {/* Tab 2: Transactions */}
        <TabsContent value="transactions">
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Reference ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                      <TableHead>Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          No transactions imported in this batch.
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrichedTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs font-medium">{tx.id}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {tx.referenceId || "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(Number(tx.amount))}
                          </TableCell>
                          <TableCell>
                            {tx.status === "Matched" && (
                              <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                                Matched
                              </Badge>
                            )}
                            {tx.status === "Unmatched" && (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                                Unmatched
                              </Badge>
                            )}
                            {tx.status === "Review Required" && (
                              <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                                Review Required
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.status === "Matched" ? getConfidenceBadge(tx.confidence) : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Exceptions */}
        {/* Tab 3: Matched */}
        <TabsContent value="matched">
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Settlement ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Rule Used</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          No matched transactions found in this batch.
                        </TableCell>
                      </TableRow>
                    ) : (
                      matchedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-semibold text-foreground">
                            <div className="space-y-0.5">
                              <p className="truncate max-w-[200px]">{row.txDescription}</p>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                ID: {row.bankTransactionId}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {row.settlementId}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-500">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(row.amount)}
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(row.confidence)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {row.ruleUsed}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-green-500 bg-green-500/5 border-green-500/10">
                              Matched
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Exceptions */}
        <TabsContent value="exceptions">
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exceptionRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          No exceptions generated in this batch.
                        </TableCell>
                      </TableRow>
                    ) : (
                      exceptionRows.map((exc) => (
                        <TableRow key={exc.id}>
                          <TableCell className="font-semibold text-foreground">
                            <div className="space-y-0.5">
                              <p className="truncate max-w-[200px]">{exc.txDescription}</p>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                ID: {exc.bankTransactionId || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(exc.expected)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(exc.actual)}
                          </TableCell>
                          <TableCell className={cn("text-right font-semibold", exc.difference > 0 ? "text-amber-500" : "text-destructive")}>
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(exc.difference)}
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(exc.confidence)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-amber-500 bg-amber-500/5 border-amber-500/10">
                              Unresolved
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVerticalIcon className="size-4" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedException({
                                      ...exc,
                                      explanation: exc.explanation || "No explanation provided.",
                                      rootCause: "Amount mismatch detected on transaction settlement. Gateway and bank account deposits differ.",
                                      recommendation: "Manually reconcile with payment records or contact support.",
                                      confidence: exc.confidence,
                                    });
                                    setIsSheetOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <InfoIcon className="size-4 mr-2" />
                                  View Analysis
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: AI Analysis */}
        <TabsContent value="ai-analysis" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BrainIcon className="size-5 text-primary animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">AI Reconciliation Insights</CardTitle>
                <p className="text-xs text-muted-foreground">Automated ledger diagnostics and compliance highlights.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-sm">
              <div className="space-y-3">
                <h3 className="text-foreground font-semibold text-base">Executive Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The reconciliation sweep for batch <strong>{details.batch.name}</strong> completed with an automated match rate of <strong>{details.summary.matchRate.toFixed(1)}%</strong>. 
                  A total of <strong>{details.summary.matchedTransactions}</strong> transactions were matched successfully. 
                  However, <strong>{details.exceptions.length}</strong> exceptions require manual administrative review due to missing reference details or amount mismatches.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-foreground font-semibold text-base text-red-500">Top Risk Areas</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <strong>Amount Discrepancies:</strong> {details.exceptions.filter(e => e.type === "AMOUNT_MISMATCH").length} transactions show variance between bank receipts and Gateway settlement records.
                  </li>
                  <li>
                    <strong>Missing Reference Identifiers:</strong> {details.exceptions.filter(e => e.type === "MISSING_SETTLEMENT").length} transactions lack UTR / Reference IDs, complicating automated matching.
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-foreground font-semibold text-base text-green-500">Recommendations</h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>Retrieve the settlement statements from the Razorpay dashboard for dates matching the exceptions list to verify missing transactions.</li>
                  <li>Export the exceptions table as CSV and upload to the ledger admin portal for adjustments.</li>
                  <li>Reach out to bank operations for transactions lacking UTR numbers.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      )}

      {/* AlertDialog Confirmation before starting reconciliation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Reconciliation</AlertDialogTitle>
            <AlertDialogDescription>
              This will run the reconciliation engine against all transactions in the batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={triggerReconciliation}>
              Run Reconciliation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exception Analysis Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md bg-card text-foreground border-l border-border">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <BrainIcon className="size-5 text-primary" />
              AI Exception Analysis
            </SheetTitle>
            <SheetDescription className="text-xs">
              Diagnostics and suggested resolution paths.
            </SheetDescription>
          </SheetHeader>

          {selectedException && (
            <div className="mt-6 space-y-6">
              <Card className="border-border bg-muted/5">
                <CardHeader className="py-3 flex flex-row items-center justify-between border-b border-border/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</span>
                  <Badge variant="destructive" className="uppercase text-[10px]">
                    {selectedException.type.replace("_", " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="flex justify-between items-baseline border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Exception ID</span>
                    <span className="font-mono text-foreground truncate select-all max-w-[180px]">
                      {selectedException.id}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Confidence Score</span>
                    {getConfidenceBadge(selectedException.confidence)}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <InfoIcon className="size-3.5 text-primary" />
                    AI Diagnosis
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-lg">
                    {selectedException.explanation}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangleIcon className="size-3.5 text-destructive" />
                    Root Cause
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-lg">
                    {selectedException.rootCause}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <SparklesIcon className="size-3.5 text-green-500" />
                    Recommended Action
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-lg">
                    {selectedException.recommendation}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSheetOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    alert(`Resolving exception ${selectedException.id} manually...`);
                    setIsSheetOpen(false);
                  }}
                >
                  Apply Resolution
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
