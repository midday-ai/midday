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
          <div className="flex gap-4 items-center">
            {legend.items.map((item, index) => (
              <div
                key={`legend-${item.label}-${index}`}
                className="flex gap-2 items-center"
              >
                <div
                  className={cn(
                    "w-2 h-2",
                    item.type === "solid" &&
                      !item.color &&
                      "bg-black dark:bg-white",
                    item.type === "dashed" &&
                      !item.color &&
                      "bg-[#707070] dark:bg-[#666666]",
                    item.type === "pattern" &&
                      !item.color &&
                      "bg-[repeating-linear-gradient(45deg,#707070,#707070_1px,transparent_1px,transparent_2px)] dark:bg-[repeating-linear-gradient(45deg,#666666,#666666_1px,transparent_1px,transparent_2px)]",
                  )}
                  style={{
                    background:
                      item.type === "solid"
                        ? item.color || undefined
                        : item.type === "pattern"
                          ? item.color
                            ? `repeating-linear-gradient(45deg, ${item.color}, ${item.color} 1px, transparent 1px, transparent 2px)`
                            : undefined
                          : item.color || undefined,
                    borderRadius: "0",
                  }}
                />
                <span className="text-[12px] text-[#707070] dark:text-[#666666]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div style={{ height }}>{children}</div>
    </div>
  );
}
