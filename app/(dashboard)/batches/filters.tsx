"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { CalendarIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statuses = [
  { value: "ALL", label: "All Batches" },
  { value: "CREATED", label: "Created" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export function BatchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";

  const [search, setSearch] = React.useState(currentSearch);

  // Debounce search input updates to the URL search parameters
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      router.push(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  const handleStatusChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "ALL") {
      params.set("status", val);
    } else {
      params.delete("status");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex border-b border-border/40 pb-1 gap-2 overflow-x-auto select-none">
        {statuses.map((s) => {
          const isActive = currentStatus === s.value;
          return (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={cn(
                "pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all leading-none focus:outline-none whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Search & Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search batches by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-card/45 border-border/80 text-xs w-full"
          />
        </div>

        {/* Date Selector Placeholder */}
        <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground justify-start font-normal bg-card/30 border-border/60 text-xs w-full sm:w-auto" disabled>
          <CalendarIcon className="size-4" />
          <span>Filter by date...</span>
        </Button>
      </div>
    </div>
  );
}
