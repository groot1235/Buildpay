"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
      <Card className="max-w-md w-full border-border text-center shadow-lg bg-card">
        <CardHeader className="space-y-2">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-2">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Application Error</span>
          <CardTitle className="text-2xl font-extrabold text-foreground">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this section. This has been logged and we're looking into it.
          </p>
          {error.message && (
            <div className="border border-border/80 rounded bg-muted/20 p-3 text-left font-mono text-xs text-muted-foreground select-all break-all max-h-24 overflow-y-auto">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="default" size="sm" onClick={() => reset()} className="w-full sm:w-auto gap-2 cursor-pointer">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
              <Home className="size-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
