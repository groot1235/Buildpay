"use client";

import * as React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/dashboard/sidebar";
import { Header } from "@/components/header";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  BrainIcon,
  SparklesIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CopilotPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestions = [
    "Why did match rate drop?",
    "Show biggest mismatches",
    "Summarize latest batch",
    "What needs attention?",
    "Which bank causes most exceptions?",
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to receive response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error(err);
      toast.add({
        title: "Copilot Error",
        description: err.message || "An error occurred during communication.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.add({
      title: "Copied",
      description: "Response copied to clipboard.",
      type: "success",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Custom Markdown parsing render helper
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: React.ReactNode[] = [];
    let tableHeaders: string[] = [];

    const parseInline = (line: string) => {
      const parts = line.split(/(\*\*|`)/g);
      let isBold = false;
      let isCode = false;
      return parts.map((part, idx) => {
        if (part === "**") {
          isBold = !isBold;
          return null;
        }
        if (part === "`") {
          isCode = !isCode;
          return null;
        }
        if (isCode) {
          return (
            <code key={idx} className="font-mono bg-muted/95 border border-border px-1 py-0.5 rounded text-[11px] text-foreground font-semibold">
              {part}
            </code>
          );
        }
        if (isBold) {
          return <strong key={idx} className="font-semibold text-foreground">{part}</strong>;
        }
        return part;
      }).filter(Boolean);
    };

    lines.forEach((line, idx) => {
      // 1. Table formatting
      if (line.trim().startsWith("|")) {
        if (inList) {
          elements.push(<ul key={`list-${idx}`} className="list-disc pl-5 space-y-1.5 my-3 text-xs text-muted-foreground">{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        const cells = line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (line.includes("---")) {
          return;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          return;
        } else {
          tableRows.push(
            <tr key={`tr-${idx}`} className="border-b border-border/40 hover:bg-muted/5 last:border-0">
              {cells.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          );
          return;
        }
      } else if (inTable) {
        elements.push(
          <div key={`table-wrapper-${idx}`} className="overflow-x-auto border border-border rounded-lg my-4 bg-background/20">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/10 border-b border-border/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  {tableHeaders.map((h, hIdx) => (
                    <th key={hIdx} className="px-4 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {tableRows}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
        tableHeaders = [];
      }

      // 2. Headings
      if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-sm font-semibold text-foreground mt-4 mb-2">{parseInline(line.slice(4))}</h3>);
        return;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-base font-semibold text-foreground mt-5 mb-2 border-b border-border/20 pb-1">{parseInline(line.slice(3))}</h2>);
        return;
      }

      // 3. Unordered Lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().slice(2);
        listItems.push(<li key={`li-${idx}`}>{parseInline(content)}</li>);
        inList = true;
        return;
      }

      if (inList && !line.trim().startsWith("- ") && !line.trim().startsWith("* ")) {
        elements.push(<ul key={`list-${idx}`} className="list-disc pl-5 space-y-1.5 my-3 text-xs text-muted-foreground">{listItems}</ul>);
        inList = false;
        listItems = [];
      }

      // 4. Standard Paragraph
      if (line.trim()) {
        elements.push(<p key={idx} className="text-xs leading-relaxed text-muted-foreground my-2">{parseInline(line)}</p>);
      }
    });

    if (inList) {
      elements.push(<ul key="list-end" className="list-disc pl-5 space-y-1.5 my-3 text-xs text-muted-foreground">{listItems}</ul>);
    }
    if (inTable) {
      elements.push(
        <div key="table-end" className="overflow-x-auto border border-border rounded-lg my-4 bg-background/20">
          <table className="w-full border-collapse text-left">
            <thead className="bg-muted/10 border-b border-border/40 text-xs font-semibold text-muted-foreground">
              <tr>
                {tableHeaders.map((h, hIdx) => (
                  <th key={hIdx} className="px-4 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {tableRows}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground flex font-sans">
      {/* Global Sidebar layout */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header primaryCtaLabel="Upload CSV" primaryCtaHref="/upload" />

        {/* Content Body */}
        <main className="flex-1 flex flex-col justify-between overflow-hidden bg-background px-8 py-8">
          <div className="space-y-1 mb-6 shrink-0">
            <BreadcrumbNav items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "AI Copilot" }
            ]} />
            <h1 className="text-3xl font-semibold tracking-tight">AI Copilot</h1>
            <p className="text-muted-foreground text-sm">
              Leverage conversational intelligence to query batches, mismatches, and run audits.
            </p>
          </div>

          {/* Chat Window Panel */}
          <div className="flex-1 border border-border bg-card/10 rounded-xl flex flex-col justify-between min-h-0 relative">
            
            {/* Scrollable conversation history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-fade-in">
                    <BrainIcon className="size-6 text-primary" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-lg font-medium text-foreground">Reconciliation Assistant</h2>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Ask me queries regarding match rate performance metrics, transaction anomalies, sync logs, or outstanding exceptions.
                    </p>
                  </div>

                  {/* Suggestion Prompts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl pt-4">
                    {suggestions.map((s, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => handleSendMessage(s)}
                        className="text-xs h-auto py-3 px-4 text-left justify-start border-border bg-background hover:bg-muted font-normal cursor-pointer rounded-lg truncate block"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 p-4 rounded-xl border ${
                        m.role === "assistant"
                          ? "bg-card border-border/80"
                          : "bg-muted/30 border-border/30"
                      }`}
                    >
                      {/* Avatar Icon */}
                      <div className="shrink-0">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center border ${
                            m.role === "assistant"
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-muted border-border/60 text-muted-foreground"
                          }`}
                        >
                          {m.role === "assistant" ? <SparklesIcon className="size-4" /> : <UserIcon className="size-4" />}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 space-y-3 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
                          {m.role === "assistant" ? "BuildPay AI" : "You"}
                        </span>
                        
                        <div className="text-sm">
                          {m.role === "assistant" ? (
                            renderMessageContent(m.content)
                          ) : (
                            <p className="text-xs text-foreground font-medium">{m.content}</p>
                          )}
                        </div>
                      </div>

                      {/* Copy Action Button for AI response */}
                      {m.role === "assistant" && (
                        <div className="shrink-0 self-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(m.content, idx)}
                            className="size-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                          >
                            {copiedIndex === idx ? (
                              <CheckIcon className="size-4 text-green-500" />
                            ) : (
                              <CopyIcon className="size-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-4 p-4 rounded-xl border bg-card border-border/80 animate-pulse">
                      <div className="shrink-0">
                        <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                          <SparklesIcon className="size-4 animate-spin" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
                          BuildPay AI
                        </span>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-2/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Sticky Input Bar at Bottom */}
            <div className="p-4 border-t border-border bg-card/25 shrink-0 rounded-b-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex gap-2"
              >
                <Input
                  type="text"
                  placeholder="Ask a question about your bank statements and settlements..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-background border-border text-xs h-10"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="h-10 px-4 text-xs cursor-pointer gap-1.5 shrink-0"
                >
                  <span>Send</span>
                  <SendIcon className="size-3.5" />
                </Button>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
