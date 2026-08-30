import { db } from "@/lib/db";
import { Sidebar, MobileSidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { UserButton } from "@clerk/nextjs";
import { GlobalSearch } from "@/src/components/search/global-search";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Settings",
  description: "Configure workspace settings and gateway connections.",
};

export default async function SettingsPage() {
  const isConnected = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== "placeholder");

  // Load last sync metadata if available
  const lastSyncRecord = await db.razorpaySync.findFirst({
    orderBy: { syncDate: "desc" },
  });

  const lastSyncString = lastSyncRecord
    ? new Date(lastSyncRecord.syncDate).toLocaleString("en-IN")
    : "Never";

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Settings Body */}
        <main className="flex-1 overflow-y-auto bg-background px-8 py-8">
          <div className="space-y-1 mb-8">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings" }
            ]} />
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure workspace settings and gateway connections.
            </p>
          </div>

          <SettingsClient
            initialConnected={isConnected}
            lastSyncTime={lastSyncString}
            recordsSynced={lastSyncRecord?.recordsCount || 0}
          />
        </main>
      </div>
    </div>
  );
}
