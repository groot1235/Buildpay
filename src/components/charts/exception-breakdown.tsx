"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export interface ExceptionBreakdownItem {
  name: string;
  value: number;
}

interface ExceptionBreakdownProps {
  exceptionBreakdown?: ExceptionBreakdownItem[];
}

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#71717a",
];

export function ExceptionBreakdown({ exceptionBreakdown }: ExceptionBreakdownProps) {
  const data = exceptionBreakdown || [];
  const isEmpty = data.length === 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Exception Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[240px] flex items-center justify-center">
        {isEmpty ? (
          <div className="text-xs text-muted-foreground text-center">
            No reconciliation data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#09090b" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                }}
                labelClassName="text-muted-foreground text-xs"
                itemStyle={{ fontSize: "12px" }}
                formatter={(value: any, name: any) => [`${value}`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
