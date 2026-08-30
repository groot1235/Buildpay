"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, FolderKanban, ArrowLeftRight, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export interface BatchResult {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface TransactionResult {
  id: string;
  referenceId: string;
  amount: number;
  batch: {
    name: string;
  };
}

export interface ExceptionResult {
  id: string;
  type: string;
  batch: {
    name: string;
  };
}

export interface SearchResults {
  batches: BatchResult[];
  transactions: TransactionResult[];
  exceptions: ExceptionResult[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);
  const [results, setResults] = React.useState<SearchResults>({
    batches: [],
    transactions: [],
    exceptions: [],
  });

  React.useEffect(() => {
    setIsMac(typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Handle Ctrl+K / Cmd+K shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced API fetch
  React.useEffect(() => {
    if (!query.trim()) {
      setResults({ batches: [], transactions: [], exceptions: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  const hasResults =
    results.batches.length > 0 ||
    results.transactions.length > 0 ||
    results.exceptions.length > 0;

  return (
    <>
      {/* Search Input Trigger with Keyboard Hint */}
      <div
        onClick={() => setOpen(true)}
        className="relative w-full max-w-md cursor-pointer select-none group"
      >
        <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <Input
          type="search"
          placeholder="Search batches, transactions..."
          className="pl-9 pr-14 h-9 bg-background pointer-events-none w-full border-border/60"
          readOnly
        />
        <kbd className="absolute right-3 top-2 text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 font-mono font-medium">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </div>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="sm:max-w-[700px] border border-border bg-popover shadow-2xl"
      >
        <div className="relative">
          <CommandInput
            placeholder="Type batch name, transaction ID, reference ID or exception type..."
            value={query}
            onValueChange={setQuery}
          />
          {isLoading && (
            <div className="absolute right-3 top-3 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <CommandList className="border-t border-border/50 max-h-[450px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="h-3.5 w-16 bg-muted animate-pulse rounded-md" />
                <div className="flex items-center gap-3">
                  <div className="size-5 bg-muted animate-pulse rounded-full" />
                  <div className="h-5 flex-1 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-24 bg-muted animate-pulse rounded-md" />
                <div className="flex items-center gap-3">
                  <div className="size-5 bg-muted animate-pulse rounded-full" />
                  <div className="h-5 flex-1 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <CommandEmpty className="py-12 text-center border-none">
                <div className="flex flex-col items-center justify-center space-y-4 px-6 max-w-md mx-auto">
                  <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <SearchIcon className="size-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground text-sm block">No results found</span>
                    <span className="text-xs text-muted-foreground leading-relaxed block">
                      We couldn't find any batches, transactions, or exceptions matching your query.
                    </span>
                  </div>
                  <div className="w-full text-left bg-muted/20 border border-border/40 p-4 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Search Suggestions
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Try searching for one of the following terms:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["settlement", "refund", "payout", "reference id", "batch name"].map((term) => (
                        <span
                          key={term}
                          onClick={() => setQuery(term)}
                          className="text-[10px] font-mono bg-muted/60 text-foreground border border-border/60 hover:border-primary/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CommandEmpty>

              {/* Batches */}
              {results.batches.length > 0 && (
                <CommandGroup heading="Batches" className="px-2">
                  {results.batches.map((batch) => (
                    <CommandItem
                      key={batch.id}
                      value={`batch-${batch.id}`}
                      onSelect={() => handleSelect(`/batches/${batch.id}`)}
                      className="flex items-center gap-3 cursor-pointer py-2 rounded-lg"
                    >
                      <FolderKanban className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground leading-none">{batch.name}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 leading-none">
                          <span>Status: {batch.status}</span>
                          <span>•</span>
                          <span>Created: {new Date(batch.createdAt).toLocaleDateString("en-IN")}</span>
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Transactions */}
              {results.transactions.length > 0 && (
                <CommandGroup heading="Transactions" className="px-2">
                  {results.transactions.map((tx) => (
                    <CommandItem
                      key={tx.id}
                      value={`tx-${tx.id}`}
                      onSelect={() => handleSelect(`/transactions/${tx.id}`)}
                      className="flex items-center gap-3 cursor-pointer py-2 rounded-lg"
                    >
                      <ArrowLeftRight className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-foreground leading-none">{tx.id}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 leading-none">
                          <span>Ref: {tx.referenceId}</span>
                          <span>•</span>
                          <span>Batch: {tx.batch.name}</span>
                          <span>•</span>
                          <span className="text-foreground font-semibold">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(tx.amount)}
                          </span>
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Exceptions */}
              {results.exceptions.length > 0 && (
                <CommandGroup heading="Exceptions" className="px-2">
                  {results.exceptions.map((exc) => (
                    <CommandItem
                      key={exc.id}
                      value={`exc-${exc.id}`}
                      onSelect={() => handleSelect(`/exceptions?selected=${exc.id}`)}
                      className="flex items-center gap-3 cursor-pointer py-2 rounded-lg"
                    >
                      <AlertTriangle className="size-4 text-destructive shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-destructive leading-none">
                          {exc.type.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 leading-none">
                          <span>Batch: {exc.batch.name}</span>
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
