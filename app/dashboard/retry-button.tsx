"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleRetry}
      disabled={isPending}
      className="gap-2"
    >
      <RefreshCwIcon className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      Retry
    </Button>
  );
}
