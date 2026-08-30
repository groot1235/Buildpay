"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { GlobalSearch } from "@/src/components/search/global-search";
import { MobileSidebar } from "@/app/dashboard/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Bell,
  Upload,
} from "lucide-react";

interface HeaderProps {
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Header({
  primaryCtaLabel = "Upload CSV",
  primaryCtaHref = "/upload",
}: HeaderProps) {
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed loading notifications:", err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed marking read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.add({
          title: "Success",
          description: "All notifications marked as read.",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Failed marking all read:", err);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
        toast.add({
          title: "Cleared",
          description: "Notification history cleared.",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Failed clearing notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10 font-sans">
      {/* Left side: Mobile trigger and Global Search */}
      <div className="flex items-center gap-4 flex-1">
        <MobileSidebar />
        <div className="flex-1 max-w-sm">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">

        {/* Stateful Notification Bell in Drawer Sheet */}
        <Sheet>
          <SheetTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 border border-transparent hover:border-border hover:bg-muted cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 size-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-card font-mono tabular-nums">
                  {unreadCount}
                </span>
              )}
            </Button>
          } />
          <SheetContent side="right" className="w-[360px] sm:w-[420px] p-0 bg-card border-l border-border text-foreground flex flex-col h-full font-sans">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] h-7 px-2 cursor-pointer font-medium text-primary hover:text-primary/80">
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-[10px] h-7 px-2 cursor-pointer font-medium text-destructive hover:text-destructive/80">
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center border border-border/40">
                    <Bell className="size-4.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">All caught up!</span>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    No new alerts or matching notifications recorded in this session.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer relative group ${
                        n.read
                          ? "bg-card/45 border-border/40 opacity-75 hover:bg-muted/10"
                          : "bg-muted/15 border-border/70 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-foreground">{n.title}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60 select-none">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-normal pr-4">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono capitalize tracking-tight">
                          {n.type.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                        {!n.read && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Primary CTA */}
        <Link href={primaryCtaHref} aria-label={primaryCtaLabel}>
          <Button variant="default" size="sm" className="h-9 gap-2 shrink-0 cursor-pointer text-xs">
            <Upload className="size-4" />
            <span className="hidden md:inline">{primaryCtaLabel}</span>
          </Button>
        </Link>

        {/* User Button */}
        <div className="size-8 rounded-full border border-border flex items-center justify-center overflow-hidden">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
