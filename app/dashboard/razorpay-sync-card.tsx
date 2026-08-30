"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { RefreshCwIcon, CheckCircle2Icon, AlertCircleIcon, InfoIcon, ShieldCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RazorpaySyncCardProps {
  initialConnected: boolean;
  initialLastSync: string;
  initialVolume: number;
  initialRecords: number;
  initialStatus: string;
  inlineMode?: boolean;
}

export function RazorpaySyncCard({
  initialConnected,
  initialLastSync,
  initialVolume,
  initialRecords,
  initialStatus,
  inlineMode,
}: RazorpaySyncCardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncDetails, setSyncDetails] = React.useState({
    connected: initialConnected,
    lastSync: initialLastSync,
    volume: initialVolume,
    records: initialRecords,
    status: initialStatus,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/razorpay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: false }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Sync failed.");
      }

      setSyncDetails({
        connected: initialConnected,
        lastSync: new Date(resData.lastSynced).toLocaleString("en-IN"),
        volume: resData.volumeImported,
        records: resData.recordsCount,
        status: "SUCCESS",
      });

      toast.add({
        title: "Sync Completed",
        description: `Imported ${resData.recordsCount} records totaling ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(resData.volumeImported)}.`,
        type: "success",
      });

      router.refresh();
    } catch (err: any) {
      console.error(err);
      
      setSyncDetails(prev => ({
        ...prev,
        status: "FAILED",
      }));

      toast.add({
        title: "Sync Failed",
        description: err.message || "Failed to synchronize with Razorpay APIs.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (inlineMode) {
    return (
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="w-full justify-start gap-2 h-10 text-xs bg-background border-border/60 hover:bg-muted"
      >
        <RefreshCwIcon className={cn("size-4", isSyncing && "animate-spin")} />
        {isSyncing ? "Syncing Razorpay..." : "Sync Razorpay Data"}
      </Button>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheckIcon className="size-4.5 text-primary" />
          Razorpay Integration
        </CardTitle>
        {syncDetails.connected ? (
          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
            Sandbox Simulator
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground block">Last Sync Status</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              {syncDetails.status === "SUCCESS" && (
                <>
                  <CheckCircle2Icon className="size-3.5 text-green-500" />
                  Success
                </>
              )}
              {syncDetails.status === "FAILED" && (
                <>
                  <AlertCircleIcon className="size-3.5 text-destructive" />
                  Failed
                </>
              )}
              {syncDetails.status === "NEVER" && (
                <>
                  <InfoIcon className="size-3.5 text-muted-foreground" />
                  Never Synced
                </>
              )}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground block">Last Synced At</span>
            <span className="font-semibold text-foreground truncate block">
              {syncDetails.lastSync}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground block">Settlement Volume</span>
            <span className="font-semibold text-foreground block">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(syncDetails.volume)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground block">Records Synced</span>
            <span className="font-semibold text-foreground block">
              {syncDetails.records} records
            </span>
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          size="sm"
          className="w-full gap-2 cursor-pointer"
        >
          <RefreshCwIcon className={isSyncing ? "size-3.5 animate-spin" : "size-3.5"} />
          {isSyncing ? "Syncing..." : "Sync Razorpay Data"}
        </Button>
      </CardContent>
    </Card>
  );
}
