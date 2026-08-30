"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  BrainIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ShieldAlertIcon,
  FileDownIcon,
  CheckIcon,
  CheckCircleIcon,
} from "lucide-react";

interface ExceptionDetails {
  id: string;
  type: string;
  amount: number;
  confidence: number;
  createdAt: string;
  explanation: string;
  recommendation: string;
  gatewayValue?: number;
  bankValue?: number;
  difference?: number;
  riskLevel?: "Low" | "Medium" | "High";
}

interface ExceptionReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exception: ExceptionDetails | null;
}

export function ExceptionReviewSheet({
  open,
  onOpenChange,
  exception,
}: ExceptionReviewSheetProps) {
  if (!exception) return null;

  // Derive risk level if not specified
  const riskLevel =
    exception.riskLevel ||
    (exception.amount > 5000 || exception.type === "MISSING_SETTLEMENT"
      ? "High"
      : exception.amount > 1000
      ? "Medium"
      : "Low");

  // Derive comparison values if not specified
  const gatewayVal = exception.gatewayValue ?? exception.amount;
  const bankVal = exception.bankValue ?? 0;
  const diffVal = exception.difference ?? Math.abs(gatewayVal - bankVal);

  const getConfidenceBadge = (confidence: number) => {
    const percent = confidence * 100;
    if (percent >= 95) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
          High ({percent.toFixed(0)}%)
        </Badge>
      );
    } else if (percent >= 80) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
          Medium ({percent.toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">
          Low ({percent.toFixed(0)}%)
        </Badge>
      );
    }
  };

  const getRiskBadge = (level: "Low" | "Medium" | "High") => {
    switch (level) {
      case "Low":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
            Low Risk
          </Badge>
        );
      case "Medium":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
            Medium Risk
          </Badge>
        );
      case "High":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">
            High Risk
          </Badge>
        );
    }
  };

  const handleAction = (actionName: string) => {
    alert(`Action executed: ${actionName} for exception ${exception.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 bg-card text-foreground flex flex-col h-full border-l border-border">
        {/* Scrollable Container */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Sheet Header */}
            <SheetHeader className="space-y-1.5 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive" className="uppercase text-[10px] tracking-wider">
                  {exception.type.replace("_", " ")}
                </Badge>
                {getConfidenceBadge(exception.confidence)}
                {getRiskBadge(riskLevel)}
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                Exception Discrepancy Review
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                ID: <code className="font-mono bg-muted/40 px-1 py-0.5 rounded">{exception.id}</code>
              </SheetDescription>
            </SheetHeader>

            <Separator />

            {/* Exception Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/10 rounded-lg border border-border/40 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Discrepancy Amount
                </span>
                <p className="text-xl font-bold text-destructive">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(exception.amount)}
                </p>
              </div>

              <div className="p-3 bg-muted/10 rounded-lg border border-border/40 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Created Date
                </span>
                <p className="text-sm font-semibold pt-1">
                  {new Date(exception.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* AI Investigation Section */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BrainIcon className="size-4 text-primary" />
                  AI Investigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Root Cause Analysis</span>
                  <p className="leading-relaxed text-foreground bg-muted/5 p-2.5 rounded border border-border/30">
                    {exception.explanation}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Supporting Evidence</span>
                  <p className="leading-relaxed text-muted-foreground">
                    Reconciliation engine detected mismatch between gateway deposit log and settlement ledger entries.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground">Risk Assessment</span>
                  <p className="leading-relaxed text-muted-foreground">
                    Discrepancy is isolated to transaction records. Risk of systemic accounting mismatch is{" "}
                    <strong className="text-foreground">{riskLevel.toLowerCase()}</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Section - Comparison Table */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evidence Logs Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/10 text-left text-muted-foreground">
                        <th className="p-3 font-semibold">Source</th>
                        <th className="p-3 font-semibold text-right">Gateway Value</th>
                        <th className="p-3 font-semibold text-right">Bank Value</th>
                        <th className="p-3 font-semibold text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border last:border-0 hover:bg-muted/5">
                        <td className="p-3 font-medium">Platform Deposit</td>
                        <td className="p-3 text-right">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(gatewayVal)}
                        </td>
                        <td className="p-3 text-right">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(bankVal)}
                        </td>
                        <td className="p-3 text-right text-destructive font-semibold">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(diffVal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Operational Recommendations */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlertIcon className="size-4 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-2 bg-destructive/5 border border-destructive/20 rounded">
                  <Badge variant="destructive" className="text-[9px] uppercase mt-0.5">
                    Critical
                  </Badge>
                  <p className="text-foreground leading-relaxed">
                    {exception.recommendation}
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2 bg-muted/10 border border-border/40 rounded">
                  <Badge variant="secondary" className="text-[9px] uppercase mt-0.5">
                    Standard
                  </Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    Verify gateway commission logs to ensure no platform fees are omitted in calculation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Persistent Bottom Actions Area */}
        <div className="p-4 border-t border-border bg-card grid grid-cols-3 gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleAction("Resolve")}
            className="w-full gap-1 text-xs"
          >
            <CheckCircleIcon className="size-3.5" />
            Resolve
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("Mark Reviewed")}
            className="w-full gap-1 text-xs"
          >
            <CheckIcon className="size-3.5" />
            Reviewed
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("Export Evidence")}
            className="w-full gap-1 text-xs"
          >
            <FileDownIcon className="size-3.5" />
            Export
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
