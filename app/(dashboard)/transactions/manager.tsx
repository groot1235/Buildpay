"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
  EyeIcon,
  LayersIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  BrainIcon,
  Upload,
  ArrowLeftRight,
  CalendarIcon,
} from "lucide-react";
import Link from "next/link";

interface TransactionItem {
  id: string;
  referenceId: string;
  amount: number;
  batchName: string;
  batchId: string;
  status: "Matched" | "Exception" | "Pending";
  createdAt: string;
  description: string;
  type: string;
  relatedMatch: {
    id: string;
    confidence: number;
    ruleUsed: string;
  } | null;
  relatedException: {
    type: string;
    explanation: string;
  } | null;
}

interface TransactionsManagerProps {
  transactions: TransactionItem[];
}

export function TransactionsManager({ transactions }: TransactionsManagerProps) {
  const { user } = useUser();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Selection state for detail sheet view
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedTxId, setSelectedTxId] = React.useState<string | null>(null);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(search.toLowerCase()) ||
        tx.batchName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  const activeTx = React.useMemo(() => {
    return transactions.find((t) => t.id === selectedTxId) || null;
  }, [transactions, selectedTxId]);

  const handleOpenDetails = (txId: string) => {
    setSelectedTxId(txId);
    setDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Matched":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
            Matched
          </span>
        );
      case "Exception":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            Exception
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border">
            Pending
          </span>
        );
    }
  };

  const handleInvestigate = (tx: TransactionItem) => {
    if (tx.status === "Exception") {
      router.push("/exceptions");
    } else {
      alert(`Reconciliation analysis ran on transaction: ${tx.id}. Status is currently ${tx.status}.`);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full font-sans text-foreground">
        {/* Onboarding Empty State */}
        <div className="border border-border bg-card rounded-xl p-8 text-center space-y-6">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <ArrowLeftRight className="size-6 text-primary" />
          </div>
          
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-medium text-foreground">No transactions imported yet</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Upload bank statements to view transaction lists and settle matches.
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <Link href="/upload">
              <Button variant="default" className="gap-2 cursor-pointer h-9 text-xs">
                <Upload className="size-4" />
                Upload Statement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const exportLedgerToCSV = () => {
    let csv = "Transaction ID,Reference ID,Description,Amount,Type,Batch,Status,Date\n";
    for (const tx of filteredTransactions) {
      csv += `"${tx.id}","${tx.referenceId || ""}","${tx.description || ""}",${tx.amount},"${tx.type}","${tx.batchName}","${tx.status}","${tx.createdAt}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ledger-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (user) {
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXPORT",
          userEmail: user.primaryEmailAddress?.emailAddress || "admin@buildpay.co",
          userName: user.fullName || "Admin User",
          entityType: "LEDGER",
          entityId: "all_transactions",
          entityName: `CSV Ledger Export - ${filteredTransactions.length} items`,
        }),
      }).catch(console.error);
    }
  };

  const totalCount = transactions.length;
  const matchedCount = transactions.filter((t) => t.status === "Matched").length;
  const matchRate = totalCount > 0 ? (matchedCount / totalCount) * 100 : 0;
  const lastImportDate = transactions.length > 0
    ? new Date(Math.max(...transactions.map(t => new Date(t.createdAt).getTime()))).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    : "—";

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* 1. Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border bg-card rounded-xl p-6">
          <span className="text-sm font-medium text-muted-foreground">Imported Transactions</span>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold tabular-nums text-foreground" style={{ fontFeatureSettings: '"tnum"' }}>{totalCount}</span>
          </div>
        </Card>
        <Card className="border border-border bg-card rounded-xl p-6">
          <span className="text-sm font-medium text-muted-foreground">Settlements</span>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold tabular-nums text-foreground" style={{ fontFeatureSettings: '"tnum"' }}>{matchedCount}</span>
          </div>
        </Card>
        <Card className="border border-border bg-card rounded-xl p-6">
          <span className="text-sm font-medium text-muted-foreground">Match Rate</span>
          <div className="mt-4">
            <span className="text-3xl font-mono font-bold tabular-nums text-foreground" style={{ fontFeatureSettings: '"tnum"' }}>{matchRate.toFixed(1)}%</span>
          </div>
        </Card>
        <Card className="border border-border bg-card rounded-xl p-6">
          <span className="text-sm font-medium text-muted-foreground">Last Import</span>
          <div className="mt-4">
            <span className="text-3xl font-semibold text-foreground font-sans">{lastImportDate}</span>
          </div>
        </Card>
      </div>

      {/* 2. Filter Bar & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reference UTR, description, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-card border-border text-xs w-full"
          />
        </div>

        {/* Filters and export button row */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Select */}
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 bg-card border-border text-xs w-36 cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Matched">Matched</SelectItem>
              <SelectItem value="Exception">Exception</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range button */}
          <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground bg-background border-border text-xs cursor-default">
            <CalendarIcon className="size-4" />
            <span>Date Range</span>
          </Button>

          {/* Export action */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportLedgerToCSV}
            className="h-9 gap-2 bg-background border-border text-xs cursor-pointer"
          >
            <Upload className="size-4 rotate-180" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 3. Main Data Table Area */}
      <Card className="border border-border bg-card rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-muted/10 sticky top-0">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="pl-6 h-10 text-xs font-semibold">Date</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Reference</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-right h-10 text-xs font-semibold">Amount</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Source</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Status</TableHead>
                  <TableHead className="w-[80px] pr-6 h-10 text-xs font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <ArrowLeftRight className="size-8 text-muted-foreground opacity-60" />
                        <span className="text-sm font-semibold text-foreground">No transactions found</span>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          No transactions match your search filters or status parameters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/10 transition-colors border-b border-border/30">
                      <TableCell className="text-xs text-muted-foreground pl-6 py-3.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold py-3.5" style={{ fontFeatureSettings: '"tnum"' }}>
                        {tx.referenceId || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground py-3.5 max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold py-3.5" style={{ fontFeatureSettings: '"tnum"' }}>
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(tx.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3.5">
                        {tx.type === "DEPOSIT" ? "Bank Statement" : "Razorpay Settlement"}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {getStatusBadge(tx.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer rounded-md">
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="bg-card border border-border">
                            <DropdownMenuItem onClick={() => handleOpenDetails(tx.id)} className="cursor-pointer">
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInvestigate(tx)} className="cursor-pointer">
                              Investigate Mismatch
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs">
        <div className="text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length} records
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
            Next
          </Button>
        </div>
      </div>

      {/* Transaction Details Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-80 sm:max-w-md p-6 bg-card text-foreground flex flex-col h-full border-l border-border">
          {activeTx && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-lg font-bold">Transaction Details</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-6 pt-4 overflow-y-auto">
                {/* Core Specs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="col-span-2">{getStatusBadge(activeTx.status)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">ID</span>
                    <span className="col-span-2 font-mono text-xs truncate select-all">
                      {activeTx.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="col-span-2 font-mono text-xs truncate select-all">
                      {activeTx.referenceId}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="col-span-2 font-bold">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(activeTx.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Batch</span>
                    <span className="col-span-2 truncate">{activeTx.batchName}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="col-span-2">
                      {new Date(activeTx.createdAt).toLocaleString("en-US")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="col-span-2">
                      <Badge variant="outline" className="text-xs uppercase">
                        {activeTx.type}
                      </Badge>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Description</span>
                    <span className="col-span-2 text-muted-foreground text-xs">
                      {activeTx.description}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Related Match Details */}
                {activeTx.relatedMatch && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2Icon className="size-4" />
                      <span className="text-sm font-semibold">Matched Record Details</span>
                    </div>

                    <div className="space-y-2 pl-6 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Match ID:</strong>{" "}
                        <span className="font-mono">{activeTx.relatedMatch.id}</span>
                      </p>
                      <p>
                        <strong className="text-foreground">Rule Used:</strong>{" "}
                        {activeTx.relatedMatch.ruleUsed}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <strong className="text-foreground">Match Score:</strong>
                        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 text-[10px] py-0">
                          {(activeTx.relatedMatch.confidence * 100).toFixed(0)}% Confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Exception Details */}
                {activeTx.relatedException && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertTriangleIcon className="size-4 shrink-0" />
                      <span className="text-sm font-semibold">Exception Details</span>
                    </div>

                    <div className="space-y-2 pl-6 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Type:</strong>{" "}
                        <Badge variant="destructive" className="text-[10px] uppercase">
                          {activeTx.relatedException.type.replace("_", " ")}
                        </Badge>
                      </p>
                      <div className="bg-destructive/5 border border-destructive/20 p-2 rounded-md space-y-1">
                        <span className="text-[10px] font-bold text-destructive uppercase">
                          AI Diagnostic Explanation
                        </span>
                        <p className="leading-relaxed">
                          {activeTx.relatedException.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Association State */}
                {!activeTx.relatedMatch && !activeTx.relatedException && (
                  <div className="space-y-2 flex flex-col items-center justify-center text-center p-4 border rounded-lg bg-muted/5">
                    <HelpCircleIcon className="size-6 text-muted-foreground" />
                    <span className="text-xs font-semibold">No Reconciliation Link</span>
                    <p className="text-[10px] text-muted-foreground">
                      This transaction is currently pending reconciliation matching.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
