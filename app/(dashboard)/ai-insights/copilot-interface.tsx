"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainIcon, SendIcon, SparklesIcon, MessageSquareIcon } from "lucide-react";

interface Recommendation {
  id: string;
  text: string;
  impact: "High" | "Medium" | "Low";
}

interface RecommendationsPanelProps {
  initialRecommendations?: Recommendation[];
}

export function RecommendationsPanel({ initialRecommendations = [] }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>(initialRecommendations);

  React.useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const handleAction = (id: string, text: string) => {
    alert(`Initiating action: "${text}"`);
    // Filter out resolved recommendations for satisfying UX
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          Actionable Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No recommendations available at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/10 rounded-lg border border-border/40"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{rec.text}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Impact:</span>
                    <Badge
                      variant="outline"
                      className={
                        rec.impact === "High"
                          ? "text-green-500 border-green-500/20 bg-green-500/5 text-[9px]"
                          : "text-amber-500 border-amber-500/20 bg-amber-500/5 text-[9px]"
                      }
                    >
                      {rec.impact} Impact
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(rec.id, rec.text)}
                  className="shrink-0 text-xs h-8"
                >
                  Run Action
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CopilotChatProps {
  unresolvedCount: number;
}

export function CopilotChat({ unresolvedCount }: CopilotChatProps) {
  const [query, setQuery] = React.useState("");
  const [chatLog, setChatLog] = React.useState<{ role: "user" | "copilot"; text: string }[]>([]);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
    setQuery("");
    setIsPending(true);

    setTimeout(() => {
      const responseText = unresolvedCount > 0 
        ? `I've analyzed the active reconciliation data. There are currently ${unresolvedCount} active discrepancy items requiring operator review. You can run automated actions from the Actionable Recommendations panel or drill down into the Exceptions tab.`
        : `I've analyzed the active reconciliation data. All transactions are currently successfully matched with settlements. No action is required.`;

      setChatLog((prev) => [
        ...prev,
        {
          role: "copilot",
          text: responseText,
        },
      ]);
      setIsPending(false);
    }, 1200);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-primary" />
          Ask BuildPay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {chatLog.length > 0 && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto border border-border/50 p-4 rounded-lg bg-muted/5">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs leading-relaxed max-w-[85%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground ml-auto"
                    : "bg-muted/30 border border-border/30 text-muted-foreground"
                }`}
              >
                {msg.role === "copilot" && <BrainIcon className="size-4 text-primary shrink-0" />}
                <p>{msg.text}</p>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-2 items-center text-xs text-muted-foreground animate-pulse">
                <BrainIcon className="size-4 text-primary shrink-0" />
                <span>BuildPay Copilot is analyzing...</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            placeholder="Ask BuildPay to explain trends, investigate exceptions, or analyze reconciliation performance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-[90px] rounded-lg border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-sans"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} size="sm" className="gap-2 text-xs">
              <SendIcon className="size-3.5" />
              Send Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
