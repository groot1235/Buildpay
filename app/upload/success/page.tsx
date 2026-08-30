import * as React from "react";
import Link from "next/link";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { GlobalSearch } from "@/src/components/search/global-search";
import SuccessClient from "./success-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Successful",
  description: "Bank statement statement has been parsed successfully.",
};

export default function UploadSuccessPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <div className="font-bold text-lg tracking-tight md:hidden">
              BuildPay
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/upload" aria-label="Upload bank statement CSV">
              <Button variant="default" size="sm" className="gap-2 shrink-0 cursor-pointer">
                <Upload className="size-4" />
                <span className="hidden md:inline">Upload CSV</span>
              </Button>
            </Link>
            <UserButton />
          </div>
        </header>

        {/* Success Page Body */}
        <main className="flex-1 p-6 flex flex-col justify-center items-center bg-background">
          <React.Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">Loading status details...</div>}>
            <SuccessClient />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
