"use client";

import type { BaseCanvasData } from "@api/ai/canvas/base-canvas";
import { formatAmount } from "@midday/utils/format";

// Base props that all canvas components receive
export interface BaseCanvasProps<TData = any> {
  canvasData: BaseCanvasData<TData>;
}

// Generic loading skeleton component
export function CanvasLoadingSkeleton({
  title,
  sections,
}: {
  title: string;
  sections: Array<{ name: string; rows: number; height?: string }>;
}) {
  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <button
          type="button"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          View all
        </button>
      </div>

      {sections.map((section, index) => (
        <div key={section.name}>
          <h3 className="text-lg font-semibold mb-3">{section.name}</h3>
          <div className="animate-pulse space-y-2">
            {Array.from({ length: section.rows }, (_, i) => (
              <div
                key={i.toString()}
                className={`bg-muted rounded ${section.height || "h-8"}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic metrics card grid
export function MetricsGrid({
  metrics,
  currency,
}: {
  metrics: Array<{
    title: string;
    value: number;
    currency: string;
    subtitle: string;
  }>;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <div key={index.toString()} className="border rounded p-4">
          <div className="text-muted-foreground text-sm mb-1">
            {metric.title}
          </div>
          <div className="text-2xl font-semibold mb-1">
            {metric.currency === "percentage"
              ? `${metric.value}%`
              : metric.currency === "count"
                ? metric.value
                : formatAmount({
                    amount: metric.value,
                    currency: metric.currency,
                  })}
          </div>
          <div className="text-muted-foreground text-xs">{metric.subtitle}</div>
        </div>
      ))}
    </div>
  );
}

// Generic summary section
export function SummarySection({
  summary,
}: {
  summary?: { overview: string; recommendations: string };
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Summary & Recommendations</h2>
      <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
        {summary ? (
          <>
            <p>{summary.overview}</p>
            <p>{summary.recommendations}</p>
          </>
        ) : (
          <p>Analysis complete. Summary will appear here.</p>
        )}
      </div>
    </div>
  );
}

// Base canvas component with common layout
export function BaseCanvasComponent<TData>({
  canvasData,
  children,
  loadingSections,
}: BaseCanvasProps<TData> & {
  children: React.ReactNode;
  loadingSections: Array<{ name: string; rows: number; height?: string }>;
}) {
  // Safety check for canvas data
  if (!canvasData || !canvasData.data) {
    return (
      <div className="w-full p-6">
        <div className="text-center text-muted-foreground">
          Loading analysis...
        </div>
      </div>
    );
  }

  const { data } = canvasData;

  if (data.isLoading) {
    return (
      <CanvasLoadingSkeleton title={data.title} sections={loadingSections} />
    );
  }

  return <div className="w-full p-6 space-y-6">{children}</div>;
}
