"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface MatchRateHistoryItem {
  day: string;
  rate: number;
}

interface MatchRateTrendProps {
  matchRateHistory?: MatchRateHistoryItem[];
}

export function MatchRateTrend({ matchRateHistory }: MatchRateTrendProps) {
  const data = matchRateHistory || [];
  const isEmpty = data.length === 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Match Rate Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] flex items-center justify-center pl-0 pr-4">
        {isEmpty ? (
          <div className="text-xs text-muted-foreground text-center">
            No reconciliation data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
                domain={[60, 100]}
                dx={-5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                }}
                labelClassName="text-muted-foreground text-xs font-medium"
                itemStyle={{ color: "#ffffff", fontSize: "12px" }}
                formatter={(value: any) => [`${value}%`, "Match Rate"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ stroke: "#10b981", strokeWidth: 1, r: 3, fill: "#09090b" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
