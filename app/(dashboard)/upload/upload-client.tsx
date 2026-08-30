"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GlobalSearch } from "@/src/components/search/global-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { uploadCSV, reconcileBatch } from "@/lib/api/buildpay";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Upload,
  FileIcon,
  Loader2Icon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  PlayIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  Trash2Icon,
} from "lucide-react";

type UploadState = "empty" | "dragging" | "preview" | "uploading" | "processing" | "completed" | "error";

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [state, setState] = React.useState<UploadState>("empty");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    batchId: string;
    transactionsImported: number;
    bankName: string;
    batchName: string;
  } | null>(null);

  // CSV Preview State
  const [previewRows, setPreviewRows] = React.useState<string[][]>([]);
  const [rowCount, setRowCount] = React.useState<number | null>(null);

  // Upload Configurations
  const [customBatchName, setCustomBatchName] = React.useState("");
  const [selectedBank, setSelectedBank] = React.useState("AUTO");
  const [detectedBank, setDetectedBank] = React.useState<string | null>(null);

  // Processing state step messages
  const [processingMsg, setProcessingMsg] = React.useState("Processing bank statement...");

  // Reconcile pending trigger state
  const [isReconciling, setIsReconciling] = React.useState(false);

  const detectBank = (headers: string[]) => {
    const normalized = headers.map(h => h.toLowerCase().trim());
    if (normalized.some(h => h.includes("chq./ref.no.") || h.includes("withdrawal amt."))) return "HDFC";
    if (normalized.some(h => h.includes("transaction remarks") || h.includes("withdrawal (dr)") || h.includes("deposit (cr)"))) return "ICICI";
    if (normalized.some(h => h.includes("txn date") || h.includes("ref no./cheque no."))) return "SBI";
    if (normalized.some(h => h.includes("particulars") || h.includes("bal"))) return "AXIS";
    if (normalized.some(h => h.includes("chq/ref no") || h.includes("dr/cr"))) return "KOTAK";
    return "HDFC";
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Only CSV files are supported.");
      setState("error");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Read and parse first few rows of CSV for client-side preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
        setRowCount(lines.length - 1); // Exclude header row

        // Parse first 5 rows with safe quote regex split
        const parsed = lines.slice(0, 5).map(line => {
          return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, ''));
        });
        setPreviewRows(parsed);

        const headerRow = parsed[0] || [];
        const detected = detectBank(headerRow);
        setDetectedBank(detected);
        setSelectedBank(detected); // Auto-populate selected dropdown!
        setState("preview");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setState("uploading");
    setProgress(0);
    setError(null);

    // Simulate progress bars
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 120);

    try {
      const finalBatchName = customBatchName.trim() || `Imported Batch - ${new Date().toLocaleDateString()}`;
      const res = await uploadCSV(file, finalBatchName, selectedBank);

      clearInterval(progressInterval);
      setProgress(100);

      if (res.success && res.batchId) {
        setState("processing");
        setProcessingMsg("Processing bank statement...");
        
        setTimeout(() => {
          setProcessingMsg("Detecting bank headers...");
        }, 500);

        setTimeout(() => {
          setProcessingMsg("Creating reconciliation batch...");
        }, 1000);

        setTimeout(() => {
          router.push(`/upload/success?batchId=${res.batchId}&batchName=${encodeURIComponent(finalBatchName)}&count=${res.transactionsImported || 0}`);
        }, 1500);
      } else {
        setError(res.error || "Failed to upload file.");
        setState("error");
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err?.message || "An unexpected error occurred during upload.");
      setState("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === "empty") {
      setState("dragging");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === "dragging") {
      setState("empty");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setState("empty");
    setFile(null);
    setProgress(0);
    setError(null);
    setResult(null);
    setPreviewRows([]);
    setRowCount(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleStartReconciliation = async () => {
    if (!result?.batchId) return;
    setIsReconciling(true);
    try {
      const res = await reconcileBatch(result.batchId);
      if (res.success) {
        router.push(`/batches/${result.batchId}`);
      } else {
        alert(res.error || "Failed to trigger reconciliation.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while reconciling.");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <div className="font-bold text-lg tracking-tight md:hidden">
              BuildPay
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        {/* Upload Body */}
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Upload Statement" }
            ]} />
            <h1 className="text-3xl font-bold tracking-tight">Upload Statement</h1>
            <p className="text-muted-foreground text-sm">
              Upload a bank statement ledger to kickstart the auto-reconciliation engine.
            </p>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-6">
              {/* Optional Configs Form before uploading */}
              {state === "empty" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="batch-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Batch Name (Optional)
                    </label>
                    <Input
                      id="batch-name"
                      placeholder="e.g. August Statements"
                      value={customBatchName}
                      onChange={(e) => setCustomBatchName(e.target.value)}
                      className="bg-muted/10 border-border h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bank-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Bank Statement Source
                    </label>
                    <Select value={selectedBank} onValueChange={(val) => val && setSelectedBank(val)}>
                      <SelectTrigger id="bank-select" className="bg-muted/10 border-border h-9 cursor-pointer">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Auto-Detect Bank</SelectItem>
                        <SelectItem value="HDFC">HDFC Bank Ledger</SelectItem>
                        <SelectItem value="ICICI">ICICI Bank Ledger</SelectItem>
                        <SelectItem value="SBI">State Bank of India (SBI)</SelectItem>
                        <SelectItem value="AXIS">Axis Bank Ledger</SelectItem>
                        <SelectItem value="KOTAK">Kotak Mahindra Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Upload Drop Zone / State Render */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-colors text-center flex flex-col items-center justify-center min-h-[260px] ${
                  state === "dragging"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/5"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                  id="csv-file-input"
                />

                {/* Empty & Dragging State */}
                {(state === "empty" || state === "dragging") && (
                  <label
                    htmlFor="csv-file-input"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    aria-label="Upload bank statement CSV"
                    className="flex flex-col items-center justify-center cursor-pointer space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-4 w-full h-full"
                  >
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 select-none">
                      <p className="text-sm font-semibold">
                        {state === "dragging" ? "Drop CSV file to load preview" : "Drag & drop your bank statement, or browse files"}
                      </p>
                      <p className="text-xs text-muted-foreground">Accepts structured .csv statements</p>
                    </div>
                  </label>
                )}

                {/* CSV File Selected Preview Card State */}
                {state === "preview" && file && (
                  <div className="w-full space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-3">
                        <FileIcon className="size-8 text-primary shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground truncate max-w-sm">{file.name}</p>
                            {detectedBank && (
                              <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-500 text-[10px] font-semibold px-2 py-0">
                                Detected: {detectedBank}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{rowCount ? `${rowCount} transactions` : "Calculating rows..."}</span>
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={handleReset} aria-label="Discard file" className="text-muted-foreground hover:text-destructive">
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>

                    {/* CSV Table Preview Grid */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CSV Data Sample Preview</span>
                      <div className="border border-border/80 rounded-lg overflow-hidden bg-muted/5">
                        <div className="overflow-x-auto max-h-48">
                          <Table className="text-xs">
                            <TableHeader className="bg-muted/40">
                              <TableRow>
                                {previewRows[0]?.map((head, idx) => (
                                  <TableHead key={idx} className="h-8 font-semibold text-muted-foreground whitespace-nowrap">{head}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewRows.slice(1).map((row, rowIdx) => (
                                <TableRow key={rowIdx}>
                                  {row.map((cell, cellIdx) => (
                                    <TableCell key={cellIdx} className="py-1.5 whitespace-nowrap truncate max-w-[150px] font-mono text-[11px]">{cell}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons to trigger the upload */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        Change File
                      </Button>
                      <Button variant="default" size="sm" onClick={handleUploadSubmit} className="gap-2">
                        <Upload className="size-4" />
                        Import & Parse Batch
                      </Button>
                    </div>
                  </div>
                )}

                {/* Uploading State */}
                {state === "uploading" && file && (
                  <div className="w-full max-w-sm space-y-6">
                    <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/50">
                      <FileIcon className="size-8 text-primary shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Loader2Icon className="size-5 animate-spin text-muted-foreground shrink-0" />
                    </div>

                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-xs text-muted-foreground">Uploading files securely...</p>
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {state === "processing" && file && (
                  <div className="space-y-4">
                    <Loader2Icon className="size-10 animate-spin text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{processingMsg}</p>
                      <p className="text-xs text-muted-foreground">Mapping CSV headings to database columns</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {state === "error" && (
                  <div className="space-y-6 max-w-sm">
                    <div className="mx-auto size-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                      <AlertTriangleIcon className="size-6 text-red-500" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">Import Failed</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {error || "An error occurred while uploading your statement."}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="gap-2 cursor-pointer"
                    >
                      <RefreshCwIcon className="size-4" />
                      Retry Import
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
