"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, PlayIcon, FileTextIcon, EyeIcon } from "lucide-react";
import { reconcileBatch } from "@/lib/api/buildpay";

interface RowActionsProps {
  batchId: string;
}

export function RowActions({ batchId }: RowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleReconcile = async () => {
    startTransition(async () => {
      try {
        const res = await reconcileBatch(batchId);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to trigger reconciliation.");
        }
      } catch (err) {
        console.error("Reconcile error:", err);
        alert("An error occurred while reconciling.");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon-xs" className="h-8 w-8" disabled={isPending}>
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      } />
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2">
          <EyeIcon className="size-4 text-muted-foreground" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReconcile} className="gap-2" disabled={isPending}>
          <PlayIcon className="size-4 text-muted-foreground" />
          <span>Reconcile Batch</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <span>Download Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
