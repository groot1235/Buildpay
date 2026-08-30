import Link from "next/link";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Layers, Upload } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | BuildPay",
  description: "Terms and conditions governing the use of the BuildPay reconciliation platform.",
};

export default function TermsPage() {
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

        {/* Page Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
          <div className="space-y-1">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Terms of Service" }
            ]} />
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: August 26, 2026
            </p>
          </div>

          <Card className="border-border max-w-3xl bg-card">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Layers className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Platform Terms of Use</CardTitle>
                <p className="text-xs text-muted-foreground">Rules governing automated reconciliation statement imports.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">1. Agreement to Terms</h3>
                <p>
                  By accessing or uploading statement datasets onto BuildPay, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these provisions, you must terminate platform usage immediately.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">2. Account Responsibility</h3>
                <p>
                  Users must maintain the confidentiality of statement keys, API credentials, and portal sessions. BuildPay is not responsible for unauthorized exports stemming from credentials leaked by users.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">3. Acceptable Statement Usage</h3>
                <p>
                  You represent and warrant that you hold legitimate permissions and property rights over all uploaded bank statement records. Uploading mock, deceptive, or malicious datasets is strictly prohibited.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">4. Liability Limitations</h3>
                <p>
                  BuildPay is an auto-matching reconciliation tool and is not an accounting firm. We make no warranty that AI analysis will be 100% free of manual exceptions. All transactions must be verified by a human administrator prior to ledger settlement actions.
                </p>
              </section>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
