"use client";

import { cn } from "@midday/ui/cn";

interface MetricItem {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
}

type GridLayout = "1/1" | "2/2" | "2/3" | "4/4";

interface MetricGridProps {
  items: MetricItem[];
  layout?: GridLayout;
}

const layoutConfig: Record<string, { columns: number; maxItems: number }> = {
  "1/1": { columns: 1, maxItems: 1 },
  "2/2": { columns: 2, maxItems: 4 },
  "2/3": { columns: 2, maxItems: 3 },
  "4/4": { columns: 4, maxItems: 4 },
};

export function MetricGrid({ items, layout = "2/2" }: MetricGridProps) {
  const config = layoutConfig[layout] || layoutConfig["2/2"];
  const displayed = items.slice(0, config.maxItems);

  return (
    <div className="mb-6">
      <div
        className={cn("grid gap-3", {
          "grid-cols-1": config.columns === 1,
          "grid-cols-2": config.columns === 2,
          "grid-cols-4": config.columns === 4,
        })}
      >
        {displayed.map((item) => (
          <div
            key={item.id}
            className="relative border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] overflow-hidden"
          >
            <div
              className="absolute inset-0 dark:hidden"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div
              className="absolute inset-0 hidden dark:block"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative">
              <div className="text-[12px] text-[#707070] dark:text-[#666666] mb-1">
                {item.title}
              </div>
              <div className="text-[18px] font-normal font-sans text-black dark:text-white mb-1">
                {item.value}
              </div>
              {item.subtitle && (
                <div className="text-[10px] text-[#707070] dark:text-[#666666]">
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
