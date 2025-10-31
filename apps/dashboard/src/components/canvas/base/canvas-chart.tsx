"use client";

import { SkeletonChart } from "@/components/canvas/base/skeleton";
import { cn } from "@midday/ui/cn";
import type { ReactNode } from "react";

interface CanvasChartProps {
  title: string;
  children: ReactNode;
  legend?: {
    items: Array<{
      label: string;
      type: "solid" | "dashed" | "pattern";
      color?: string;
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
        <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
          {title}
        </h4>
        {legend && (
          <div className="flex gap-4 items-center" data-hide-in-pdf="true">
            {legend.items.map((item, index) => {
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
