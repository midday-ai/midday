"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function HealthReportCanvas() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowAnimation(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const healthMetrics = [
    {
      id: "cash-flow-score",
      title: "Cash Flow Score",
      value: "8.5/10",
      subtitle: "Excellent",
      trend: { value: "+0.3 vs last month", isPositive: true },
    },
    {
      id: "profitability-score",
      title: "Profitability Score",
      value: "7.2/10",
      subtitle: "Good",
      trend: { value: "+0.8 vs last month", isPositive: true },
    },
    {
      id: "efficiency-score",
      title: "Efficiency Score",
      value: "6.8/10",
      subtitle: "Fair",
      trend: { value: "-0.2 vs last month", isPositive: false },
    },
    {
      id: "growth-score",
      title: "Growth Score",
      value: "9.1/10",
      subtitle: "Outstanding",
      trend: { value: "+1.2 vs last month", isPositive: true },
    },
  ];

  const healthTrendData = [
    { month: "Jan", score: 7.2 },
    { month: "Feb", score: 7.5 },
    { month: "Mar", score: 7.8 },
    { month: "Apr", score: 8.1 },
    { month: "May", score: 8.3 },
    { month: "Jun", score: 8.5 },
  ];

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <CanvasHeader
          title="Health Report"
          description="Financial health metrics and KPIs"
          isLoading={isLoading}
          showAnimation={showAnimation}
        />

        <CanvasGrid
          items={healthMetrics}
          layout="2/2"
          isLoading={isLoading}
          showAnimation={showAnimation}
        />

        <CanvasChart
          title="Health Score Trend"
          legend={{
            items: [
              { label: "Overall Score", type: "solid", color: "#3b82f6" },
            ],
          }}
          isLoading={isLoading}
          showAnimation={showAnimation}
          height="16rem"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                domain={[6, 9]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0px",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CanvasChart>

        <CanvasSection
          title="Analysis"
          isLoading={isLoading}
          showAnimation={showAnimation}
        >
          <p>
            Overall financial health is strong with a composite score of 8.5/10.
            Growth metrics are particularly impressive at 9.1/10, while
            efficiency could be improved. Cash flow management is excellent,
            indicating good liquidity management.
          </p>
        </CanvasSection>
      </div>
    </BaseCanvas>
  );
}
