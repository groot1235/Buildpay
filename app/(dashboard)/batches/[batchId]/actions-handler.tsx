"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DownloadIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { getBatchReport, reconcileBatch } from "@/lib/api/buildpay";

interface ActionProps {
  batchId: string;
}

export function HeaderActions({ batchId }: ActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleReconcile = async () => {
    startTransition(async () => {
      try {
        const res = await reconcileBatch(batchId);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to trigger reconciliation.");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while reconciling.");
      }
    });
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const report = await getBatchReport(batchId);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(report, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `batch-report-${batchId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={handleReconcile} disabled={isPending} className="gap-2">
        <PlayIcon className={`size-4 ${isPending ? "animate-spin" : ""}`} />
        Reconcile Batch
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={isExporting} className="gap-2">
        <DownloadIcon className={`size-4 ${isExporting ? "animate-spin" : ""}`} />
        Download Report
      </Button>
    </div>
  );
}

export function ReconciliationCardActions({ batchId }: ActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleReconcile = async () => {
    startTransition(async () => {
      try {
        const res = await reconcileBatch(batchId);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to trigger reconciliation.");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while reconciling.");
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const report = await getBatchReport(batchId);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(report, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `batch-report-${batchId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Reconciliation Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="default" onClick={handleReconcile} disabled={isPending} className="w-full gap-2">
          <PlayIcon className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          Reconcile Batch
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="w-full gap-2">
          <DownloadIcon className={`size-4 ${isExporting ? "animate-spin" : ""}`} />
          Export Report
        </Button>
      </CardContent>
    </Card>
  );
}

export function ReviewExceptionButton({ exceptionId }: { exceptionId: string }) {
  const handleReview = () => {
    alert(`Initiating manual review for exception: ${exceptionId}`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleReview} className="w-full gap-1.5 mt-2">
      <AlertCircleIcon className="size-3.5" />
      Review Exception
    </Button>
  );
}
