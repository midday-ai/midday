import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

// Chart config type
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

// Chart context
type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

// Chart container
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, style, ...props }, ref) => {
    // Generate CSS variables from config
    const cssVars = React.useMemo(() => {
      const vars: Record<string, string> = {};
      for (const [key, value] of Object.entries(config)) {
        if (value.color) {
          vars[`--color-${key}`] = value.color;
        }
      }
      return vars;
    }, [config]);

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn(
            "flex aspect-video justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_*:focus]:outline-none [&_*:focus-visible]:outline-none",
            className,
          )}
          style={{ ...cssVars, ...style }}
          {...props}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

// Chart tooltip content
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: Record<string, unknown>;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  hideLabel?: boolean;
  indicator?: "line" | "dot" | "dashed";
  className?: string;
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    { active, payload, label, hideLabel = false, indicator = "dot", className },
    ref,
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "border bg-background px-3 py-2 text-xs shadow-md",
          className,
        )}
      >
        {!hideLabel && label && (
          <div className="mb-1.5 font-medium">{label}</div>
        )}
        <div className="flex flex-col gap-1">
          {payload.map((item, index) => {
            const key = item.dataKey || item.name;
            const itemConfig = config[key as string];
            const indicatorColor = item.color || itemConfig?.color;

            return (
              <div key={index.toString()} className="flex items-center gap-2">
                {indicator === "dot" && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}
                {indicator === "line" && (
                  <div
                    className="h-0.5 w-3"
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}
                <span className="text-muted-foreground">
                  {itemConfig?.label || key}:
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// Re-export Recharts components
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltipContent,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useChart,
};
