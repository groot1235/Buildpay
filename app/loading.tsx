import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 font-sans">
      <div className="flex items-center gap-2 font-bold text-2xl tracking-tight select-none animate-pulse">
        <span className="bg-primary text-primary-foreground p-1.5 rounded-md text-sm font-mono">BP</span>
        <span>BuildPay</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Loading secure workspace...</span>
      </div>
    </div>
  );
}
