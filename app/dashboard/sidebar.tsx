"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  AlertTriangle,
  Settings,
  Menu,
  History,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Reconciliation", href: "/batches", icon: Layers },
    { label: "Reports", href: "/reports", icon: TrendingUp },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Exceptions", href: "/exceptions", icon: AlertTriangle },
    { label: "Audit Trail", href: "/audit", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div
      className={cn(
        "hidden md:flex h-screen sticky top-0 shrink-0 z-20 font-sans select-none border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      <aside className="w-full flex flex-col justify-between h-full relative">
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 size-6 rounded-full border border-border bg-card hover:bg-muted cursor-pointer flex items-center justify-center z-30"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight className="size-3.5 text-muted-foreground hover:text-foreground" />
          ) : (
            <ChevronsLeft className="size-3.5 text-muted-foreground hover:text-foreground" />
          )}
        </Button>

        <div className="flex flex-col gap-6 p-4">
          {/* Brand header */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-1.5 focus-visible:outline-none overflow-hidden h-7">
            <Image src="/logoipsum-419.svg" alt="BuildPay Logo" width={24} height={24} className="shrink-0" />
            {!isCollapsed && (
              <span className="font-bold text-base tracking-tight text-foreground whitespace-nowrap transition-opacity duration-200">
                BuildPay
              </span>
            )}
          </Link>

          {/* Nav Items */}
          <TooltipProvider>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href.split("?")[0] ||
                  (item.href === "/batches" && pathname.startsWith("/batches")) ||
                  (item.href === "/transactions" && pathname.startsWith("/transactions")) ||
                  (item.href === "/exceptions" && pathname.startsWith("/exceptions"));
                const Icon = item.icon;

                const linkEl = (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left",
                      isCollapsed ? "justify-center p-2 size-9" : "gap-2.5 px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate transition-opacity duration-200">{item.label}</span>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={linkEl} />
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <React.Fragment key={item.href}>{linkEl}</React.Fragment>;
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* User profile at bottom */}
        <div className={cn("border-t border-border flex items-center gap-3 p-4", isCollapsed ? "justify-center" : "")}>
          <Avatar size="sm" className="border border-border/80 cursor-pointer shrink-0" onClick={() => router.push("/settings")}>
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1 transition-opacity duration-200">
              <span className="text-xs font-semibold text-foreground truncate">{user?.fullName || "Admin User"}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress || "admin@buildpay.co"}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) => {
    return pathname === href.split("?")[0];
  };

  const mobileNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reconciliation Batches", href: "/batches" },
    { label: "Reconciliation Reports", href: "/reports" },
    { label: "Transactions", href: "/transactions" },
    { label: "Exceptions", href: "/exceptions" },
    { label: "Audit Trail", href: "/audit" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation menu"
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
          >
            <Menu className="size-5" />
          </Button>
        } />
        <SheetContent side="left" className="w-64 p-0 bg-card border-r border-border text-foreground flex flex-col h-full font-sans">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <SheetTitle className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <Image src="/logoipsum-419.svg" alt="BuildPay Logo" width={20} height={20} className="shrink-0" />
              <span>BuildPay</span>
            </SheetTitle>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {mobileNavItems.map((item, idx) => {
              const linkActive = isActive(item.href);
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:outline-none",
                    linkActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
