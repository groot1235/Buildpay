import Link from "next/link";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Upload } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BuildPay",
  description: "Learn how BuildPay handles and protects your financial ledger data.",
};

export default function PrivacyPage() {
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
              { label: "Privacy Policy" }
            ]} />
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: August 26, 2026
            </p>
          </div>

          <Card className="border-border max-w-3xl bg-card">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Your Data Privacy Commitments</CardTitle>
                <p className="text-xs text-muted-foreground">BuildPay fintech SaaS statement reconciliation privacy rules.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">1. Information We Collect</h3>
                <p>
                  To provide our automated bank statement reconciliation service, we collect financial transaction metadata, ledger statements, upload CSV metadata, and account authentication details. We do not store raw bank passwords or write permissions on user bank accounts.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">2. How We Use Your Data</h3>
                <p>
                  We utilize your uploaded statements exclusively to run AI reconciliation sweeps, compile matched records, detect exception details, and generate diagnostic reports. Your financial metrics are never used to train global public language models.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">3. Data Security</h3>
                <p>
                  All database structures, ledger matches, and credentials are encrypted at rest using AES-256 standards and in transit via TLS 1.3 protocols. Access is strictly audited and limited to authorized deployment credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-foreground font-semibold text-base">4. Compliance and Disclosures</h3>
                <p>
                  BuildPay complies with standard financial sector security frameworks and local regulations governing digital payment processing, data audits, and record conservation.
                </p>
              </section>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
