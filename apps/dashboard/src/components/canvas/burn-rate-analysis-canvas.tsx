"use client";

import type { BurnRateCanvasData } from "@api/ai/canvas/burn-rate-canvas-tool";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { formatAmount } from "@midday/utils/format";
import {
  BaseCanvasComponent,
  type BaseCanvasProps,
  MetricsGrid,
  SummarySection,
} from "./base-canvas-component";

interface BurnRateAnalysisCanvasProps extends BaseCanvasProps<any> {
  canvasData: BurnRateCanvasData;
}

// 1️⃣ Main canvas component using base pattern
export function BurnRateAnalysisCanvas({
  canvasData,
}: BurnRateAnalysisCanvasProps) {
  // Let BaseCanvasComponent handle loading states

  return (
    <BaseCanvasComponent
      canvasData={canvasData}
      // 2️⃣ Define loading sections that match your data structure
      loadingSections={[
        { name: "Current Burn Rate", rows: 2, height: "h-16" },
        { name: "Runway Analysis", rows: 1, height: "h-24" },
        { name: "Monthly Trends", rows: 6, height: "h-12" },
        { name: "Projections", rows: 4, height: "h-10" },
        { name: "Recommendations", rows: 3, height: "h-16" },
        { name: "Summary", rows: 3, height: "h-4" },
      ]}
    >
      {/* 3️⃣ Render your canvas sections */}
      <BurnRateOverview data={canvasData?.data} />
      <RunwaySection data={canvasData?.data} />
      <TrendsSection data={canvasData?.data} />
      <ProjectionsSection data={canvasData?.data} />
      <RecommendationsSection data={canvasData?.data} />
      <SummarySection summary={canvasData?.data?.summary} />
    </BaseCanvasComponent>
  );
}

// 4️⃣ Create specialized sections for your canvas
function BurnRateOverview({ data }: { data: any }) {
  if (!data) return null;

  const trendColor = data.monthlyTrend > 0 ? "text-red-500" : "text-green-500";
  const trendIcon = data.monthlyTrend > 0 ? "↗️" : "↘️";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Burn Rate Analysis</h1>
        <Badge variant={data.monthlyTrend > 0 ? "destructive" : "default"}>
          {trendIcon} {Math.abs(data.monthlyTrend)}% vs last month
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="text-muted-foreground text-sm mb-1">
            Current Burn Rate
          </div>
          <div className="text-3xl font-bold">
            {formatAmount({
              amount: data.currentBurnRate,
              currency: data.currency,
            })}
          </div>
          <div className="text-muted-foreground text-xs">per month</div>
        </div>

        <div className="border rounded p-4">
          <div className="text-muted-foreground text-sm mb-1">Runway</div>
          <div className="text-3xl font-bold text-orange-500">
            {data.runwayMonths}
          </div>
          <div className="text-muted-foreground text-xs">months remaining</div>
        </div>

        <div className="border rounded p-4">
          <div className="text-muted-foreground text-sm mb-1">Trend</div>
          <div className={`text-3xl font-bold ${trendColor}`}>
            {data.monthlyTrend > 0 ? "+" : ""}
            {data.monthlyTrend}%
          </div>
          <div className="text-muted-foreground text-xs">month over month</div>
        </div>
      </div>
    </div>
  );
}

function RunwaySection({ data }: { data: any }) {
  if (!data) return null;

  const runwayPercentage = Math.min((data.runwayMonths / 24) * 100, 100); // 24 months = 100%
  const urgencyLevel =
    data.runwayMonths < 6
      ? "critical"
      : data.runwayMonths < 12
        ? "warning"
        : "healthy";

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Runway Status</h2>
      <div className="border rounded p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Cash Runway</span>
          <span className="text-sm text-muted-foreground">
            {data.runwayMonths} months
          </span>
        </div>
        <Progress
          value={runwayPercentage}
          className={`h-3 ${
            urgencyLevel === "critical"
              ? "bg-red-100"
              : urgencyLevel === "warning"
                ? "bg-yellow-100"
                : "bg-green-100"
          }`}
        />
        <div className="mt-2 text-sm text-muted-foreground">
          {urgencyLevel === "critical" &&
            "🚨 Critical: Immediate action required"}
          {urgencyLevel === "warning" && "⚠️ Warning: Monitor closely"}
          {urgencyLevel === "healthy" && "✅ Healthy: Good runway buffer"}
        </div>
      </div>
    </div>
  );
}

function TrendsSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Monthly Trends</h2>
      <div className="space-y-2">
        {data.monthlyData?.slice(-6).map((month: any, index: number) => (
          <div
            key={month.month}
            className="flex justify-between items-center p-3 border rounded"
          >
            <div>
              <div className="font-medium">{month.month}</div>
              <div className="text-sm text-muted-foreground">
                Revenue:{" "}
                {formatAmount({
                  amount: month.revenue,
                  currency: data.currency,
                })}{" "}
                | Expenses:{" "}
                {formatAmount({
                  amount: month.expenses,
                  currency: data.currency,
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatAmount({
                  amount: month.burnRate,
                  currency: data.currency,
                })}
              </div>
              <div className="text-sm text-muted-foreground">burn rate</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectionsSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">6-Month Projections</h2>
      <div className="space-y-2">
        {data.projections?.slice(0, 4).map((projection: any, index: number) => (
          <div
            key={projection.month}
            className="flex justify-between items-center p-2 border rounded"
          >
            <span className="font-medium">{projection.month}</span>
            <div className="text-right">
              <div className="font-semibold">
                {formatAmount({
                  amount: projection.projectedBurnRate,
                  currency: data.currency,
                })}
              </div>
              <Badge variant="outline" className="text-xs">
                {projection.confidence}% confidence
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Optimization Recommendations
      </h2>
      <div className="space-y-3">
        {data.recommendations?.map((rec: any, index: number) => (
          <div key={rec.category} className="border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{rec.category}</div>
              <Badge
                variant={rec.impact === "High" ? "destructive" : "secondary"}
              >
                {rec.impact} Impact
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Potential monthly savings:{" "}
              {formatAmount({ amount: rec.savings, currency: data.currency })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
