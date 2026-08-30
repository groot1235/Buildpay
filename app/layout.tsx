import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/react";

const manrope = Manrope({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildPay",
  applicationName: "BuildPay",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  description: "Automated, AI-powered bank statement reconciliation and financial intelligence.",
  icons: {
    icon: "/logoipsum-419.svg",
    shortcut: "/logoipsum-419.svg",
    apple: "/logoipsum-419.svg",
  },
  openGraph: {
    title: "BuildPay",
    description: "Automated, AI-powered bank statement reconciliation and financial intelligence.",
    url: "https://buildpay.co",
    siteName: "BuildPay",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildPay",
    description: "Automated, AI-powered bank statement reconciliation and financial intelligence.",
  },
};

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("h-full bg-background text-foreground", "antialiased", geistSans.variable, geistMono.variable, "font-sans", manrope.variable)}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
