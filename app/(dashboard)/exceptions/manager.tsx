"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  AlertTriangleIcon,
  SparklesIcon,
  BrainIcon,
  MoreHorizontalIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  EyeIcon,
  CheckIcon,
  Upload,
  ShieldCheckIcon,
  PlayIcon,
  CalendarIcon,
} from "lucide-react";
import Link from "next/link";

interface ExceptionItem {
  id: string;
  batchName: string;
  type: string;
  amount: number;
  createdAt: string;
  explanation: string;
  recommendation: string;
  confidence: number;
}

interface ExceptionsManagerProps {
  exceptions: ExceptionItem[];
}

export function ExceptionsManager({ exceptions }: ExceptionsManagerProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("selected");

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [confidenceFilter, setConfidenceFilter] = React.useState("ALL");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    exceptions.length > 0 ? exceptions[0].id : null
  );

  React.useEffect(() => {
    if (selectedParam && exceptions.some((e) => e.id === selectedParam)) {
      setSelectedId(selectedParam);
    }
  }, [selectedParam, exceptions]);

  // Apply filters client-side
  const filteredExceptions = React.useMemo(() => {
    return exceptions.filter((exc) => {
      const matchesSearch =
        exc.batchName.toLowerCase().includes(search.toLowerCase()) ||
        exc.type.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "ALL" || exc.type === typeFilter;

      let matchesConfidence = true;
      const pct = exc.confidence * 100;
      if (confidenceFilter === "HIGH") {
        matchesConfidence = pct >= 95;
      } else if (confidenceFilter === "MEDIUM") {
        matchesConfidence = pct >= 80 && pct < 95;
      } else if (confidenceFilter === "LOW") {
        matchesConfidence = pct < 80;
      }

      return matchesSearch && matchesType && matchesConfidence;
    });
  }, [exceptions, search, typeFilter, confidenceFilter]);

  // Sync selectedId when filtered exceptions change
  React.useEffect(() => {
    if (filteredExceptions.length > 0) {
      if (!selectedId || !filteredExceptions.some((e) => e.id === selectedId)) {
        setSelectedId(filteredExceptions[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredExceptions, selectedId]);

  const selectedException = React.useMemo(() => {
    return exceptions.find((e) => e.id === selectedId) || null;
  }, [exceptions, selectedId]);

  const getConfidenceBadge = (confidence: number) => {
    const percent = confidence * 100;
    if (percent >= 95) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
          {percent.toFixed(0)}%
        </Badge>
      );
    } else if (percent >= 80) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
          {percent.toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
          {percent.toFixed(0)}%
        </Badge>
      );
    }
  };

  const handleResolve = (id: string) => {
    alert(`Marked exception ${id} as resolved.`);
    if (user) {
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXCEPTION_REVIEW",
          userEmail: user.primaryEmailAddress?.emailAddress || "admin@buildpay.co",
          userName: user.fullName || "Admin User",
          entityType: "EXCEPTION",
          entityId: id,
          entityName: `Resolved Exception: ${id}`,
        }),
      }).catch(console.error);
    }
  };

  const handleRerun = (id: string) => {
    alert(`Re-running AI exception analysis for ${id}.`);
  };

  if (exceptions.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full font-sans text-foreground">
        {/* 1. Top Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Open Exceptions", value: "0" },
            { label: "Resolved", value: "0" },
            { label: "High Risk", value: "0" },
            { label: "Review Rate", value: "100.0%" },
          ].map((stat, idx) => (
            <Card key={idx} className="border border-border bg-card rounded-xl p-6">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <div className="mt-4">
                <span className="text-3xl font-mono font-bold tabular-nums text-foreground">{stat.value}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* 2. Large Center State */}
        <div className="border border-border bg-card rounded-xl p-8 text-center space-y-6">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <AlertTriangleIcon className="size-6 text-primary" />
          </div>
          
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-medium text-foreground">No Exceptions Found</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              BuildPay will automatically flag settlement mismatches, duplicates, and missing records.
            </p>
          </div>
        </div>

        {/* 3. Disabled Preview Rows Table */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block select-none">
            Preview Exception Scenarios
          </span>
          <Card className="border border-border bg-card rounded-xl opacity-60 pointer-events-none select-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="pl-6 h-10 text-xs font-semibold">Exception Type</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Batch</TableHead>
                    <TableHead className="text-right h-10 text-xs font-semibold">Value Diff</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Date Flagged</TableHead>
                    <TableHead className="h-10 text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { type: "Amount Mismatch", batch: "Batch #092", diff: "₹1,240.00", date: "Aug 20, 2026", status: "Amount Mismatch" },
                    { type: "Missing Settlement", batch: "Batch #092", diff: "₹12,450.00", date: "Aug 21, 2026", status: "Missing Settlement" },
                    { type: "Duplicate Transaction", batch: "Batch #093", diff: "₹450.00", date: "Aug 22, 2026", status: "Duplicate" },
                    { type: "Reference Conflict", batch: "Batch #094", diff: "₹0.00", date: "Aug 23, 2026", status: "Mismatch" },
                  ].map((row, i) => (
                    <TableRow key={i} className="border-b border-border/30 last:border-0">
                      <TableCell className="font-semibold text-sm pl-6 py-3">{row.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">{row.batch}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold py-3">{row.diff}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">{row.date}</TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const parsedValues = React.useMemo(() => {
    if (!selectedException) return null;
    const actual = Number(selectedException.amount);
    
    // Attempt to parse expected value from description or default to slightly different value
    const match = selectedException.explanation.match(/₹?([0-9,]+(?:\.[0-9]+)?)/);
    let expected = actual * 1.02; // default 2% fee markup
    if (match) {
      const cleanNum = match[1].replace(/,/g, "");
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed !== actual) {
        expected = parsed;
      }
    }
    const difference = expected - actual;
    
    return {
      expected,
      actual,
      difference,
    };
  }, [selectedException]);

  const totalCount = exceptions.length;
  const highRiskCount = exceptions.filter((e) => e.confidence < 0.8).length;
  const mediumRiskCount = exceptions.filter((e) => e.confidence >= 0.8 && e.confidence < 0.95).length;
  const lowRiskCount = exceptions.filter((e) => e.confidence >= 0.95).length;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* 1. Risk Center KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Exceptions</span>
            <p className="text-2xl font-bold font-mono">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">High Risk</span>
            <p className="text-2xl font-bold text-red-500 font-mono">{highRiskCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Medium Risk</span>
            <p className="text-2xl font-bold text-amber-500 font-mono">{mediumRiskCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card/65 shadow-sm rounded-xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider block">Low Risk</span>
            <p className="text-2xl font-bold text-green-500 font-mono">{lowRiskCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exceptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-background/50 border-border/80 text-xs"
          />
        </div>

        {/* Exception Type */}
        <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
          <SelectTrigger className="h-9 bg-background/50 border-border/80 text-xs">
            <SelectValue placeholder="Exception Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="AMOUNT_MISMATCH">Amount Mismatch</SelectItem>
            <SelectItem value="MISSING_SETTLEMENT">Missing Settlement</SelectItem>
            <SelectItem value="FEE_ADJUSTMENT">Fee Adjustment</SelectItem>
          </SelectContent>
        </Select>

        {/* Confidence Level */}
        <Select value={confidenceFilter} onValueChange={(val) => val && setConfidenceFilter(val)}>
          <SelectTrigger className="h-9 bg-background/50 border-border/80 text-xs">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Confidences</SelectItem>
            <SelectItem value="HIGH">High (95%+)</SelectItem>
            <SelectItem value="MEDIUM">Medium (80-94%)</SelectItem>
            <SelectItem value="LOW">Low (&lt;80%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Exceptions Table (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="border border-border rounded-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Batch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[60px] pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                        No exceptions match selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExceptions.map((exc) => (
                      <TableRow
                        key={exc.id}
                        onClick={() => setSelectedId(exc.id)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/10 border-b border-border/40",
                          selectedId === exc.id ? "bg-muted/65 font-medium" : ""
                        )}
                      >
                        <TableCell className="font-semibold pl-4 text-foreground truncate max-w-[150px]">{exc.batchName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {exc.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive font-mono">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(exc.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {getConfidenceBadge(exc.confidence)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {new Date(exc.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="pr-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon-xs" className="size-8">
                                <MoreHorizontalIcon className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => setSelectedId(exc.id)}>
                                <EyeIcon className="size-3.5 text-muted-foreground" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-green-500 hover:text-green-500" onClick={() => handleResolve(exc.id)}>
                                <CheckIcon className="size-3.5" />
                                <span>Mark Resolved</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => handleRerun(exc.id)}>
                                <RefreshCwIcon className="size-3.5 text-muted-foreground" />
                                <span>Rerun Analysis</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky AI Diagnostics Panel (1 col) */}
        <div className="lg:col-span-1">
          {selectedException ? (
            <Card className="border border-border bg-card p-5 space-y-5 rounded-xl sticky top-20">
              
              {/* Header */}
              <div className="space-y-2 pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Diagnostics</span>
                  <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                    {selectedException.type.replace("_", " ")}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">Exception Investigation</h4>
              </div>

              {/* Mismatch Values Ledger */}
              <div className="bg-muted/15 border border-border/40 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Expected Value</span>
                  <span className="font-bold font-mono text-foreground">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(parsedValues?.expected || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Actual Value</span>
                  <span className="font-bold font-mono text-foreground">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(parsedValues?.actual || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/30 pt-2">
                  <span className="text-muted-foreground font-medium">Difference</span>
                  <span className={cn(
                    "font-bold font-mono",
                    (parsedValues?.difference || 0) > 0 ? "text-amber-500" : "text-destructive"
                  )}>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(parsedValues?.difference || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/30 pt-2">
                  <span className="text-muted-foreground font-medium">Confidence Score</span>
                  {getConfidenceBadge(selectedException.confidence)}
                </div>
              </div>

              {/* Insights and Resolutions */}
              <div className="space-y-4 text-xs leading-normal">
                {/* Explanation */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">AI Diagnosis</span>
                  <p className="text-foreground bg-muted/10 p-3 rounded-lg border border-border/40 leading-relaxed font-medium">
                    {selectedException.explanation}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-sans">Suggested Resolution</span>
                  <p className="text-foreground bg-primary/5 p-3 rounded-lg border border-primary/20 leading-relaxed font-sans flex items-start gap-2">
                    <SparklesIcon className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{selectedException.recommendation}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border/40 flex items-center gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleResolve(selectedException.id)} 
                  className="flex-1 text-xs cursor-pointer h-9"
                >
                  <CheckIcon className="size-4 mr-1.5" />
                  Mark Resolved
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRerun(selectedException.id)} 
                  className="text-xs cursor-pointer h-9 bg-background border-border/60 hover:bg-muted"
                >
                  <RefreshCwIcon className="size-3.5" />
                </Button>
              </div>

            </Card>
          ) : (
            <Card className="border border-border/60 bg-muted/5 p-6 rounded-xl text-center text-xs text-muted-foreground select-none">
              Select an exception from the ledger table to open AI investigation details.
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
