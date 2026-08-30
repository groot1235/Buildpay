"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, LayoutDashboard, Upload } from "lucide-react";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/src/components/search/global-search";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId") || "";
  const batchName = searchParams.get("batchName") || "Imported Batch";
  const count = searchParams.get("count") || "0";

  return (
    <Card className="max-w-md w-full border-border text-center shadow-lg bg-card">
      <CardHeader className="space-y-2">
        <div className="mx-auto size-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-2">
          <CheckCircle2 className="size-6 text-green-500" />
        </div>
        <span className="text-sm font-semibold tracking-wider uppercase text-green-500">Success</span>
        <CardTitle className="text-2xl font-extrabold text-foreground">Upload Successful</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your bank statement statement has been parsed successfully. Reconciliations are now calculated and updated.
        </p>

        <div className="border border-border/80 rounded-lg p-4 bg-muted/5 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Batch Name</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">{batchName}</span>
          </div>
          {batchId && (
            <div className="flex justify-between border-t border-border/40 pt-2">
              <span className="text-muted-foreground">Batch ID</span>
              <code className="font-mono bg-muted/40 px-1 py-0.5 rounded select-all text-[11px]">{batchId}</code>
            </div>
          )}
          <div className="flex justify-between border-t border-border/40 pt-2">
            <span className="text-muted-foreground">Transactions Parsed</span>
            <span className="font-semibold text-foreground">{count}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link href="/dashboard" className="w-full sm:w-auto" aria-label="Return to Dashboard">
          <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Button>
        </Link>
        {batchId && (
          <Link href={`/batches/${batchId}`} className="w-full sm:w-auto" aria-label="Go to Batch">
            <Button variant="default" size="sm" className="w-full gap-2 cursor-pointer">
              Go to Batch
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
