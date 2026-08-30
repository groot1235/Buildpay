"use client";

import * as React from "react";
import { Sidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  SearchIcon,
  RefreshCwIcon,
  ActivityIcon,
  ShieldCheckIcon,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  userEmail: string;
  userName: string | null;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [searchUser, setSearchUser] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter && actionFilter !== "ALL") {
        params.append("action", actionFilter);
      }
      if (searchUser.trim()) {
        params.append("user", searchUser.trim());
      }

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load logs");
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      toast.add({
        title: "Audit Trail Error",
        description: err.message || "Failed to load audit trail data.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchLogs();
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <Badge variant="secondary" className="border-blue-500/20 bg-blue-500/10 text-blue-500 font-mono text-[10px]">LOGIN</Badge>;
      case "UPLOAD":
        return <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">UPLOAD</Badge>;
      case "RECONCILIATION":
        return <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-amber-500 font-mono text-[10px]">RECONCILIATION</Badge>;
      case "EXCEPTION_REVIEW":
        return <Badge variant="secondary" className="border-red-500/20 bg-red-500/10 text-red-500 font-mono text-[10px]">EXCEPTION REVIEW</Badge>;
      case "EXPORT":
        return <Badge variant="secondary" className="border-purple-500/20 bg-purple-500/10 text-purple-500 font-mono text-[10px]">EXPORT</Badge>;
      case "SYNC":
        return <Badge variant="secondary" className="border-sky-500/20 bg-sky-500/10 text-sky-500 font-mono text-[10px]">SYNC</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Main content workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Audit Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <BreadcrumbNav items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Audit Trail" }
              ]} />
              <h1 className="text-3xl font-semibold tracking-tight">Audit Trail</h1>
              <p className="text-muted-foreground text-sm">
                Audit and track operational workflows, uploads, exports, and sync activities.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="h-9 gap-2 border-border bg-card hover:bg-muted font-normal text-xs cursor-pointer md:self-end"
            >
              <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Logs</span>
            </Button>
          </div>

          <div className="space-y-6">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 border border-border bg-card/10 rounded-xl">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                {/* Search user */}
                <div className="relative flex-1 max-w-sm">
                  <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by user email or name..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    className="pl-9 h-9 bg-background border-border text-xs w-full"
                  />
                </div>

                {/* Filter by action */}
                <div className="w-full sm:w-48">
                  <Select value={actionFilter} onValueChange={(val) => val && setActionFilter(val)}>
                    <SelectTrigger className="h-9 bg-background border-border text-xs w-full cursor-pointer">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Actions</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="UPLOAD">Upload</SelectItem>
                      <SelectItem value="RECONCILIATION">Reconciliation</SelectItem>
                      <SelectItem value="EXCEPTION_REVIEW">Exception Review</SelectItem>
                      <SelectItem value="EXPORT">Export</SelectItem>
                      <SelectItem value="SYNC">Sync</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                className="h-9 border-border bg-background hover:bg-muted font-normal text-xs cursor-pointer w-full sm:w-auto"
              >
                Apply Filters
              </Button>
            </div>

            {/* Audit Table */}
            <Card className="border border-border bg-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/40">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3.5">Action</TableHead>
                    <TableHead className="font-semibold text-xs">Operator</TableHead>
                    <TableHead className="font-semibold text-xs">Entity Affected</TableHead>
                    <TableHead className="font-semibold text-xs">Entity Type</TableHead>
                    <TableHead className="font-semibold text-xs">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx} className="animate-pulse">
                        <TableCell className="py-4"><div className="h-4 bg-muted rounded w-20" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-44" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-16" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center border border-border/40">
                            <ShieldCheckIcon className="size-5 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">No logs found</span>
                          <p className="text-[11px] text-muted-foreground max-w-xs">
                            No activities matched your search constraints, or audit tracking has just been initialized.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/5 border-b border-border/40 last:border-0">
                        <TableCell className="py-3.5 font-medium">
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-foreground">{log.userName || "Admin User"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{log.userEmail}</div>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {log.entityName || log.entityId || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.entityType ? (
                            <Badge variant="outline" className="text-[9px] uppercase font-mono py-0">{log.entityType}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
