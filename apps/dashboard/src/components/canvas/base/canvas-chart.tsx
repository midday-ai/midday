"use client";

import { cn } from "@midday/ui/cn";
import type { ReactNode } from "react";
import { SkeletonChart } from "@/components/canvas/base/skeleton";

interface CanvasChartProps {
  title: string;
  children: ReactNode;
  legend?: {
    items: Array<{
      label: string;
      type: "solid" | "dashed" | "pattern" | "line";
      color?: string;
      lineStyle?: "solid" | "dashed" | "reference"; // For line-type legends
    }>;
  };
  isLoading?: boolean;
  height?: string | number;
  className?: string;
}

export function CanvasChart({
  title,
  children,
  legend,
  isLoading = false,
  height = "20rem",
  className,
}: CanvasChartProps) {
  if (isLoading) {
    return (
      <div className={cn("mb-6", className)}>
        <SkeletonChart height={height} />
      </div>
    );
  }

  return (
    <div className={cn("mb-6", className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[18px] font-normal font-serif text-primary">
          {title}
        </h4>
        {legend && (
          <div className="flex gap-4 items-center" data-hide-in-pdf="true">
            {legend.items.map((item, index) => {
              // Line-style legend (for forecast chart)
              if (item.type === "line") {
                const lineStyle = item.lineStyle || "solid";
                const lineColor = item.color || "#000000";

                // Determine line styling based on lineStyle prop
                let lineElement: React.ReactNode;
                if (lineStyle === "solid") {
                  // Solid line - use color prop or default to black/white
                  const bgColor =
                    lineColor === "white" || lineColor === "#ffffff"
                      ? "bg-black dark:bg-white"
                      : lineColor === "black" || lineColor === "#000000"
                        ? "bg-black dark:bg-white"
                        : `bg-[${lineColor}]`;
                  lineElement = (
                    <div className={`w-4 h-0.5 ${bgColor} flex-shrink-0`} />
                  );
                } else if (lineStyle === "dashed") {
                  // Dashed line - use color prop or default to grey
                  const dashColor = lineColor || "#666666";
                  const darkDashColor = "#999999";
                  lineElement = (
                    <>
                      <div
                        className="w-4 h-0.5 flex-shrink-0 dark:hidden"
                        style={{
                          backgroundImage: `repeating-linear-gradient(90deg, ${dashColor} 0px, ${dashColor} 4px, transparent 4px, transparent 8px)`,
                        }}
                      />
                      <div
                        className="w-4 h-0.5 flex-shrink-0 hidden dark:block"
                        style={{
                          backgroundImage: `repeating-linear-gradient(90deg, ${darkDashColor} 0px, ${darkDashColor} 4px, transparent 4px, transparent 8px)`,
                        }}
                      />
                    </>
                  );
                } else {
                  // Reference line style (solid grey)
                  lineElement = (
                    <div className="w-4 h-0.5 bg-[#cccccc] dark:bg-[#999999] flex-shrink-0" />
                  );
                }

                return (
                  <div
                    key={`legend-${item.label}-${index}`}
                    className="flex gap-2 items-center"
                  >
                    {lineElement}
                    <span className="text-[12px] text-[#707070] dark:text-[#666666] leading-none">
                      {item.label}
                    </span>
                  </div>
                );
              }

              // Square-style legend (existing pattern)
              const getSquareClasses = (type: string, color?: string) => {
                const baseColor = color || "#707070";

                switch (type) {
                  case "solid":
                    return "w-2 h-2 flex-shrink-0 bg-primary";
                  case "dashed":
                    return `w-2 h-2 flex-shrink-0 bg-transparent border border-dashed border-[${baseColor}]`;
                  case "pattern":
                    return "w-2 h-2 flex-shrink-0 bg-transparent";
                  default:
                    return `w-2 h-2 flex-shrink-0 bg-[${baseColor}]`;
                }
              };

              const getSquareStyle = (type: string, color?: string) => {
                const baseColor = color || "#707070";

                switch (type) {
                  case "pattern":
                    return {
                      backgroundImage: `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 1px, transparent 1px, transparent 2px)`,
                    };
                  default:
                    return {};
                }
              };

              return (
                <div
                  key={`legend-${item.label}-${index}`}
                  className="flex gap-2 items-center"
                >
                  <div
                    className={getSquareClasses(item.type, item.color)}
                    style={getSquareStyle(item.type, item.color)}
                  />
                  <span className="text-[12px] text-[#707070] dark:text-[#666666] leading-none">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div style={{ height }}>{children}</div>
    </div>
  );
}
