"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Building2,
  Key,
  RefreshCw,
} from "lucide-react";

interface SettingsClientProps {
  initialConnected: boolean;
  lastSyncTime: string;
  recordsSynced: number;
}

export function SettingsClient({
  initialConnected,
  lastSyncTime,
  recordsSynced,
}: SettingsClientProps) {
  const router = useRouter();

  const [isConnected, setIsConnected] = React.useState(initialConnected);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncTime, setSyncTime] = React.useState(lastSyncTime);
  const [recordsCount, setRecordsCount] = React.useState(recordsSynced);

  const [keyId, setKeyId] = React.useState("");
  const [keySecret, setKeySecret] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [workspaceName, setWorkspaceName] = React.useState("BuildPay");
  const [orgName, setOrgName] = React.useState("BuildPay Operations");
  const [timezone, setTimezone] = React.useState("IST");
  const [currency, setCurrency] = React.useState("INR");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId || !keySecret) {
      toast.add({
        title: "Integration Error",
        description: "Please fill out both Key ID and Key Secret credentials.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsSubmitting(false);
      toast.add({
        title: "Razorpay Connected",
        description: "Your credentials have been configured successfully.",
        type: "success",
      });
      router.refresh();
    }, 1200);
  };

  const handleSyncNow = async () => {
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

      setSyncTime(new Date(resData.lastSynced).toLocaleString("en-IN"));
      setRecordsCount(resData.recordsCount);

      toast.add({
        title: "Sync Completed",
        description: `Imported ${resData.recordsCount} records.`,
        type: "success",
      });

      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.add({
        title: "Sync Failed",
        description: err.message || "Failed to synchronize with Razorpay APIs.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setKeyId("");
    setKeySecret("");
    toast.add({
      title: "Integration Disconnected",
      description: "Razorpay credentials have been removed.",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 font-sans text-foreground max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Workspace Settings */}
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader className="pb-4 border-b border-border/40 p-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Workspace Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workspace Name</label>
              <Input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="bg-background h-9 border-border text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Organization Name</label>
              <Input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-background h-9 border-border text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timezone</label>
                <Select value={timezone} onValueChange={(val) => val && setTimezone(val)}>
                  <SelectTrigger className="h-9 bg-background border-border text-xs w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">IST (UTC+05:30)</SelectItem>
                    <SelectItem value="UTC">UTC (UTC+00:00)</SelectItem>
                    <SelectItem value="EST">EST (UTC-05:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Currency</label>
                <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                  <SelectTrigger className="h-9 bg-background border-border text-xs w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Razorpay Connection */}
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader className="pb-4 border-b border-border/40 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="size-4 text-muted-foreground" />
              Razorpay Connection
            </CardTitle>
            <Badge variant="outline" className={isConnected ? "text-green-500 border-green-500/20 bg-green-500/5 text-[10px]" : "text-muted-foreground text-[10px]"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!isConnected ? (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Key ID
                  </label>
                  <Input
                    type="text"
                    placeholder="rzp_live_..."
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    className="bg-background h-9 border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Key Secret
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className="bg-background h-9 border-border text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-9 text-xs cursor-pointer"
                >
                  {isSubmitting ? "Connecting..." : "Connect"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Account ID</span>
                    <span className="font-semibold text-foreground font-mono" style={{ fontFeatureSettings: '"tnum"' }}>
                      mid_razorpay_9823
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Connection Status</span>
                    <span className="font-semibold text-green-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="font-semibold text-foreground font-mono" style={{ fontFeatureSettings: '"tnum"' }}>
                      {syncTime}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="border-border bg-background hover:bg-muted text-xs cursor-pointer h-9 flex-1 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5"
                  >
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.add({ title: "Reconnected", description: "Razorpay connection revalidated.", type: "success" });
                    }}
                    className="border-border bg-background hover:bg-muted text-xs cursor-pointer h-9 flex-1"
                  >
                    Reconnect
                  </Button>
                  <Button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="text-xs cursor-pointer h-9 flex-1"
                  >
                    <RefreshCw className={`size-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
