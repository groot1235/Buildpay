"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fffbeb] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-200">
      <Card className="max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl">
        {/* Browser Mockup Top Bar */}
        <div className="h-10 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 flex items-center px-4 gap-1.5 select-none">
          <div className="size-3 rounded-full bg-[#ff5f56]" />
          <div className="size-3 rounded-full bg-[#ffbd2e]" />
          <div className="size-3 rounded-full bg-[#27c93f]" />
        </div>

        <div className="p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Premium SVG Illustration */}
          <div className="flex justify-center items-center">
            <svg viewBox="0 0 400 300" className="w-full h-auto max-w-[280px] md:max-w-sm text-zinc-400 dark:text-zinc-600" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hanging Line (dotted) */}
              <line x1="200" y1="0" x2="200" y2="85" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" className="text-zinc-300 dark:text-zinc-700" />

              {/* Socket & Cord Connector */}
              <path d="M193 85 H207 V98 A2 2 0 0 1 205 100 H195 A2 2 0 0 1 193 98 Z" fill="currentColor" className="text-zinc-400 dark:text-zinc-700" />
              <line x1="193" y1="90" x2="207" y2="90" stroke="currentColor" strokeWidth="1" className="text-white dark:text-zinc-900" />
              <line x1="193" y1="95" x2="207" y2="95" stroke="currentColor" strokeWidth="1" className="text-white dark:text-zinc-900" />

              {/* Warm Bulb Glow */}
              <circle cx="200" cy="125" r="45" fill="url(#yellowGlow)" opacity="0.8" />

              {/* Bulb Glass */}
              <path d="M182 110 C 182 95, 218 95, 218 110 C 218 122, 212 128, 209 135 C 208 138, 208 143, 208 145 H192 C 192 143, 192 138, 191 135 C 188 128, 182 122, 182 110 Z" stroke="currentColor" strokeWidth="3" className="text-yellow-500 dark:text-yellow-400" />
              <circle cx="200" cy="115" r="22" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" className="text-yellow-500/50" />

              {/* Filament (warm yellow lines) */}
              <path d="M195 125 L199 116 L201 116 L205 125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 dark:text-yellow-400" />

              {/* Bulb Rays */}
              <g className="text-yellow-500/80 dark:text-yellow-400/80">
                <line x1="150" y1="110" x2="160" y2="112" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="250" y1="110" x2="240" y2="112" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="200" y1="172" x2="200" y2="182" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="162" y1="80" x2="170" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="238" y1="80" x2="230" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="162" y1="145" x2="170" y2="137" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="238" y1="145" x2="230" y2="137" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Cartoon Critters */}
              {/* Critter 1 (Orange/Pink center critter looking up) */}
              <path d="M130 240 C 130 195, 185 195, 185 240 Z" fill="#f43f5e" />
              {/* Eyes */}
              <circle cx="150" cy="216" r="3.5" fill="white" />
              <circle cx="162" cy="215" r="3.5" fill="white" />
              <circle cx="150" cy="216" r="1.5" fill="#18181b" />
              <circle cx="162" cy="215" r="1.5" fill="#18181b" />
              {/* Mouth */}
              <ellipse cx="156" cy="223" rx="2" ry="3" fill="#18181b" />
              {/* Blush */}
              <circle cx="143" cy="221" r="2.5" fill="#fda4af" opacity="0.6" />
              <circle cx="169" cy="220" r="2.5" fill="#fda4af" opacity="0.6" />
              {/* Antennas */}
              <path d="M152 201 Q 146 190, 142 192" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              <path d="M162 200 Q 168 189, 172 191" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />

              {/* Critter 2 (Peach critter on left, lying down) */}
              <path d="M75 245 C 75 220, 140 220, 140 245 Z" fill="#f97316" />
              <path d="M92 232 Q 97 236, 102 232" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              <path d="M112 232 Q 117 236, 122 232" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              <path d="M101 240 Q 106 237, 111 240" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              {/* Sparkles */}
              <path d="M72 225 L75 222 M71 221 L75 222 M73 226 L73 222" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-800 dark:text-zinc-200" />

              {/* Critter 3 (Blue critter on right, triangle shape) */}
              <path d="M172 245 L202 210 L232 245 Z" fill="#6366f1" />
              <circle cx="196" cy="230" r="3" fill="white" />
              <circle cx="208" cy="230" r="3" fill="white" />
              <circle cx="196" cy="230" r="1" fill="#18181b" />
              <circle cx="208" cy="230" r="1" fill="#18181b" />
              <path d="M200 236 Q 202 238, 204 236" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              <path d="M198 218 L194 214 M210 218 L214 214" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-800 dark:text-zinc-200" />

              {/* Critter 4 (Green critter far right, tiny) */}
              <circle cx="260" cy="240" r="9" fill="#10b981" />
              <circle cx="257" cy="238" r="1.5" fill="white" />
              <circle cx="263" cy="238" r="1.5" fill="white" />
              <circle cx="257" cy="238" r="0.5" fill="#18181b" />
              <circle cx="263" cy="238" r="0.5" fill="#18181b" />
              <path d="M258 243 Q 260 244, 262 243" stroke="currentColor" strokeWidth="1" fill="none" className="text-zinc-800 dark:text-zinc-200" />
              {/* Electric spark */}
              <path d="M268 226 L270 230 L268 231 L272 235" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" className="text-yellow-500" />

              {/* Floor ground line */}
              <line x1="50" y1="245" x2="350" y2="245" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-zinc-300 dark:text-zinc-700" />

              <defs>
                <radialGradient id="yellowGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Right Column: Premium Text & CTAs */}
          <div className="flex flex-col text-left space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-1.5 inline-block">
                Error 404
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                there is <br />light in here too.
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                But the page is missing or you assembled the link incorrectly.
              </p>
            </div>

            <div className="flex flex-row items-center gap-3 pt-2">
              <Link href="/dashboard" aria-label="Go Home">
                <Button variant="default" size="default" className="gap-2 cursor-pointer rounded-xl font-semibold shadow-sm hover:shadow transition-all duration-200">
                  Go Home
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="default"
                onClick={() => router.back()}
                className="gap-2 cursor-pointer rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
                aria-label="Back to previous page"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
