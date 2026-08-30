"use client";

import * as React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DownloadIcon,
  PrinterIcon,
  TrendingUpIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  PercentIcon,
  FileSpreadsheetIcon,
} from "lucide-react";

interface SerializedTx {
  id: string;
  amount: number;
  date: string;
}

interface SerializedMatch {
  id: string;
  amount: number;
  date: string;
}

interface SerializedException {
  id: string;
  type: string;
  date: string;
}

interface ReportsClientProps {
  transactions: SerializedTx[];
  matches: SerializedMatch[];
  exceptions: SerializedException[];
}

export function ReportsClient({
  transactions,
  matches,
  exceptions,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = React.useState<"daily" | "weekly" | "monthly">("daily");

  const totalVolume = matches.reduce((sum, m) => sum + m.amount, 0);
  const matchRate = transactions.length > 0 ? (matches.length / transactions.length) * 100 : 0;
  const totalExceptions = exceptions.length;

  // Calculate Risk Heuristics Score (0 to 100)
  const riskScore = React.useMemo(() => {
    if (transactions.length === 0) return 100;
    const ratio = exceptions.length / transactions.length;
    const score = Math.max(0, 100 - Math.round(ratio * 100 * 5)); // Higher exceptions count drops score faster
    return score;
  }, [transactions, exceptions]);

  const riskLabel = riskScore >= 90 ? "Low Risk" : riskScore >= 70 ? "Medium Risk" : "High Risk";
  const riskColor = riskScore >= 90 ? "text-green-500 bg-green-500/10 border-green-500/20" : riskScore >= 70 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-red-500 bg-red-500/10 border-red-500/20";

  // Generate Period Timelines based on tab selection
  const timelineData = React.useMemo(() => {
    const data: { period: string; matchRate: number; volume: number; exceptions: number }[] = [];
    const now = new Date();

    if (activeTab === "daily") {
      // Daily Report: Last 7 Days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const startOfDay = new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = new Date(d.setHours(23, 59, 59, 999));

        const dayTxs = transactions.filter(t => new Date(t.date) >= startOfDay && new Date(t.date) <= endOfDay);
        const dayMatches = matches.filter(m => new Date(m.date) >= startOfDay && new Date(m.date) <= endOfDay);
        const dayExs = exceptions.filter(e => new Date(e.date) >= startOfDay && new Date(e.date) <= endOfDay);

        const rate = dayTxs.length > 0 ? (dayMatches.length / dayTxs.length) * 100 : 0;
        const vol = dayMatches.reduce((sum, m) => sum + m.amount, 0);

        data.push({
          period: dayStr,
          matchRate: Number(rate.toFixed(1)),
          volume: vol,
          exceptions: dayExs.length,
        });
      }
    } else if (activeTab === "weekly") {
      // Weekly Report: Last 4 Weeks
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        const weekStr = `Wk -${i}`;
        const startOfWeek = new Date(d.setDate(d.getDate() - d.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekTxs = transactions.filter(t => new Date(t.date) >= startOfWeek && new Date(t.date) <= endOfWeek);
        const weekMatches = matches.filter(m => new Date(m.date) >= startOfWeek && new Date(m.date) <= endOfWeek);
        const weekExs = exceptions.filter(e => new Date(e.date) >= startOfWeek && new Date(e.date) <= endOfWeek);

        const rate = weekTxs.length > 0 ? (weekMatches.length / weekTxs.length) * 100 : 0;
        const vol = weekMatches.reduce((sum, m) => sum + m.amount, 0);

        data.push({
          period: weekStr,
          matchRate: Number(rate.toFixed(1)),
          volume: vol,
          exceptions: weekExs.length,
        });
      }
    } else {
      // Monthly Report: Last 6 Months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const monthStr = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthTxs = transactions.filter(t => new Date(t.date) >= startOfMonth && new Date(t.date) <= endOfMonth);
        const monthMatches = matches.filter(m => new Date(m.date) >= startOfMonth && new Date(m.date) <= endOfMonth);
        const monthExs = exceptions.filter(e => new Date(e.date) >= startOfMonth && new Date(e.date) <= endOfMonth);

        const rate = monthTxs.length > 0 ? (monthMatches.length / monthTxs.length) * 100 : 0;
        const vol = monthMatches.reduce((sum, m) => sum + m.amount, 0);

        data.push({
          period: monthStr,
          matchRate: Number(rate.toFixed(1)),
          volume: vol,
          exceptions: monthExs.length,
        });
      }
    }

    return data;
  }, [transactions, matches, exceptions, activeTab]);

  // Aggregate Exception categories for PieChart visualization
  const pieData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    exceptions.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });

    return Object.keys(counts).map((type) => ({
      name: type.replace(/_/g, " ").toLowerCase(),
      value: counts[type],
    }));
  }, [exceptions]);

  const PIE_COLORS = ["#ef4444", "#f59e0b", "#a855f7", "#3b82f6", "#06b6d4"];

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = "Period,Match Rate (%),Volume (INR),Exceptions\n";
    timelineData.forEach((row) => {
      csv += `"${row.period}",${row.matchRate},${row.volume},${row.exceptions}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `executive-report-${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
      title: "Export Success",
      description: `CSV download for ${activeTab} data initiated.`,
      type: "success",
    });
  };

  const isDataEmpty = transactions.length === 0;

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans print:bg-white print:text-black">
      {/* Sidebar hidden during printing */}
      <div className="print:hidden flex shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header hidden during printing */}
        <div className="print:hidden">
          <Header />
        </div>

        {/* Content View */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 print:p-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5 print:border-none print:pb-0">
            <div className="space-y-1">
              <div className="print:hidden">
                <BreadcrumbNav items={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Reports" }
                ]} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight print:text-2xl">Executive Reporting</h1>
              <p className="text-muted-foreground text-sm print:text-xs">
                Comprehensive match diagnostics, settlement volumes, and outlier trends.
              </p>
            </div>

            {/* Print & Export triggers hidden during printing */}
            {!isDataEmpty && (
              <div className="flex gap-2.5 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPDF}
                  className="h-9 gap-1.5 border-border bg-card hover:bg-muted text-xs cursor-pointer"
                >
                  <PrinterIcon className="size-4" />
                  <span>Print PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-9 gap-1.5 border-border bg-card hover:bg-muted text-xs cursor-pointer"
                >
                  <DownloadIcon className="size-4" />
                  <span>Export CSV</span>
                </Button>
              </div>
            )}
          </div>

          {isDataEmpty ? (
            <div className="h-[450px] border border-border bg-card/10 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center border border-border/40">
                <FileSpreadsheetIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-medium text-foreground">No Auditing Data Found</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Exporting reports requires bank transaction statements. Connect your gateway and upload files to generate audit logs.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Link href="/upload">
                  <Button variant="default" className="h-9 text-xs cursor-pointer px-4">
                    Upload Statement
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Selector hidden during printing */}
              <div className="flex border border-border bg-card/40 p-1.5 rounded-xl w-fit gap-1.5 print:hidden">
                {[
                  { id: "daily", label: "Daily Report" },
                  { id: "weekly", label: "Weekly Report" },
                  { id: "monthly", label: "Monthly Report" },
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant={activeTab === t.id ? "default" : "ghost"}
                    onClick={() => setActiveTab(t.id as any)}
                    className="h-8 text-xs cursor-pointer px-4 font-medium"
                  >
                    {t.label}
                  </Button>
                ))}
              </div>

              {/* print summary header title (only visible in print layout) */}
              <div className="hidden print:block border-b border-black pb-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span>BuildPay Executive Statement Audits</span>
                  <span className="capitalize">{activeTab} Summary Period</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* 1. Metric summaries */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 print:gap-4">
                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider print:text-[10px]">Match Rate</span>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-3xl font-mono font-bold tabular-nums text-foreground print:text-xl">{matchRate.toFixed(1)}%</span>
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary print:hidden">
                      <PercentIcon className="size-4" />
                    </div>
                  </div>
                </Card>

                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider print:text-[10px]">Settled Volume</span>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-3xl font-mono font-bold tabular-nums text-foreground print:text-xl">
                      ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 print:hidden">
                      <DollarSignIcon className="size-4" />
                    </div>
                  </div>
                </Card>

                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider print:text-[10px]">Anomalies</span>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-3xl font-mono font-bold tabular-nums text-foreground print:text-xl">{totalExceptions}</span>
                    <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 print:hidden">
                      <AlertTriangleIcon className="size-4" />
                    </div>
                  </div>
                </Card>

                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider print:text-[10px]">Risk Profile</span>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-3xl font-mono font-bold tabular-nums text-foreground print:text-xl">{riskScore}/100</span>
                    <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-tight ${riskColor}`}>
                      {riskLabel}
                    </Badge>
                  </div>
                </Card>
              </div>

              {/* 2. Visualizations Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4 print:grid-cols-1">
                {/* Match Rate Line Chart */}
                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <TrendingUpIcon className="size-4 text-muted-foreground" />
                      Reconciliation Match Rate (%)
                    </CardTitle>
                  </CardHeader>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="period" className="text-[10px] font-mono" stroke="currentColor" opacity={0.4} />
                        <YAxis domain={[0, 100]} className="text-[10px] font-mono" stroke="currentColor" opacity={0.4} />
                        <ChartTooltip
                          contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: "11px", borderRadius: "8px" }}
                          labelClassName="font-mono"
                        />
                        <Line type="monotone" dataKey="matchRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Match Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Volume Bar Chart */}
                <Card className="border border-border bg-card rounded-xl p-6 print:p-4 print:border-black">
                  <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <DollarSignIcon className="size-4 text-muted-foreground" />
                      Settlement Volume (INR)
                    </CardTitle>
                  </CardHeader>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="period" className="text-[10px] font-mono" stroke="currentColor" opacity={0.4} />
                        <YAxis className="text-[10px] font-mono" stroke="currentColor" opacity={0.4} />
                        <ChartTooltip
                          contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: "11px", borderRadius: "8px" }}
                          labelClassName="font-mono"
                        />
                        <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Exception type breakdown (Pie chart + Legend detail list) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4 print:grid-cols-1">
                <Card className="border border-border bg-card rounded-xl p-6 lg:col-span-1 print:border-black">
                  <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <AlertTriangleIcon className="size-4 text-muted-foreground" />
                      Anomalies Distribution
                    </CardTitle>
                  </CardHeader>
                  <div className="h-64 flex items-center justify-center">
                    {pieData.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No anomalies resolved.</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: "11px", borderRadius: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>

                {/* Tabular detailed timeline grid list */}
                <Card className="border border-border bg-card rounded-xl p-6 lg:col-span-2 print:border-black">
                  <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
                    <CardTitle className="text-sm font-semibold">Period Auditing Summary</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                          <th className="py-2.5">Timeline Period</th>
                          <th className="py-2.5">Match Rate (%)</th>
                          <th className="py-2.5 text-right">Settled Volume (INR)</th>
                          <th className="py-2.5 text-right">Outstanding Exceptions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-foreground">
                        {timelineData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/5">
                            <td className="py-3 font-semibold">{row.period}</td>
                            <td className="py-3 font-mono tabular-nums">{row.matchRate.toFixed(1)}%</td>
                            <td className="py-3 font-mono tabular-nums text-right">
                              ₹{row.volume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 font-mono tabular-nums text-right">{row.exceptions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
