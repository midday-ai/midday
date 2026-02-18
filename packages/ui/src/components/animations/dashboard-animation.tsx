"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function DashboardAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWidgets, setShowWidgets] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [segmentProgress, setSegmentProgress] = useState<number[]>([
    0, 0, 0, 0, 0,
  ]);

  useEffect(() => {
    if (!shouldPlay) return;

    const timer = setTimeout(() => setShowWidgets(true), 0);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(timer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  useEffect(() => {
    if (showWidgets) {
      const chartTimer = setTimeout(() => setShowChart(true), 0);
      const metricsTimer = setTimeout(() => setShowMetrics(true), 500);
      const summaryTimer = setTimeout(() => setShowSummary(true), 900);
      return () => {
        clearTimeout(chartTimer);
        clearTimeout(metricsTimer);
        clearTimeout(summaryTimer);
      };
    }
  }, [showWidgets]);

  const categoryData = [
    { name: "Marketing", value: 2100, color: "hsl(var(--foreground))" },
    {
      name: "SaaS",
      value: 1300,
      color: "hsl(var(--muted-foreground))",
      opacity: 0.8,
    },
    {
      name: "Payroll",
      value: 800,
      color: "hsl(var(--muted-foreground))",
      opacity: 0.6,
    },
    {
      name: "Operations",
      value: 600,
      color: "hsl(var(--muted-foreground))",
      opacity: 0.4,
    },
    {
      name: "Other",
      value: 900,
      color: "hsl(var(--muted-foreground))",
      opacity: 0.5,
    },
  ];

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (showChart) {
      setSegmentProgress([0, 0, 0, 0, 0]);
      const segmentDuration = 0.18;
      const timeouts: NodeJS.Timeout[] = [];
      categoryData.forEach((_, index) => {
        const timeout = setTimeout(
          () => {
            setSegmentProgress((prev) => {
              const newProgress = [...prev];
              newProgress[index] = 1;
              return newProgress;
            });
          },
          index * segmentDuration * 1000,
        );
        timeouts.push(timeout);
      });
      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
    setSegmentProgress([0, 0, 0, 0, 0]);
  }, [showChart]);

  const renderPieChart = () => {
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = 60;
    const outerRadius = 90;

    let currentAngle = -90;

    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {categoryData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;

            const progress = segmentProgress[index] || 0;
            const animatedAngle = angle * progress;
            const endAngle = currentAngle + animatedAngle;

            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + outerRadius * Math.cos(startAngleRad);
            const y1 = centerY + outerRadius * Math.sin(startAngleRad);
            const x2 = centerX + outerRadius * Math.cos(endAngleRad);
            const y2 = centerY + outerRadius * Math.sin(endAngleRad);

            const x3 = centerX + innerRadius * Math.cos(endAngleRad);
            const y3 = centerY + innerRadius * Math.sin(endAngleRad);
            const x4 = centerX + innerRadius * Math.cos(startAngleRad);
            const y4 = centerY + innerRadius * Math.sin(startAngleRad);

            const largeArcFlag = animatedAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${x1} ${y1}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${x3} ${y3}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
              "Z",
            ].join(" ");

            currentAngle += angle;

            return (
              <motion.path
                key={`${item.name}-${index}`}
                d={pathData}
                fill={item.color}
                opacity={item.opacity ?? 1}
                stroke="hsl(var(--background))"
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: showChart && progress > 0 ? (item.opacity ?? 1) : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-[18px] md:text-[24px] font-normal font-serif text-foreground">
              $
              {total.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-[8px] md:text-[10px] text-muted-foreground">
              Total
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-border">
        <h3 className="text-[13px] md:text-[14px] text-foreground">
          Category Expenses
        </h3>
      </div>

      <div className="flex-1 p-2 md:p-3 overflow-hidden">
        <div className="flex flex-col gap-4 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: showChart ? 1 : 0, y: showChart ? 0 : 12 }}
            transition={{ duration: 0.4 }}
            className="bg-background border border-border p-2 md:p-4 flex flex-col items-center"
          >
            <div className="mb-3 md:mb-4 w-full">
              <h3 className="text-[9px] md:text-[10px] font-normal text-muted-foreground mb-1.5 md:mb-2">
                Category Breakdown
              </h3>
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                {categoryData.slice(0, 3).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1 md:gap-1.5"
                  >
                    <div
                      className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        opacity: item.opacity ?? 1,
                      }}
                    />
                    <span className="text-[8px] md:text-[9px] text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
              {renderPieChart()}
            </div>
          </motion.div>

          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-2 md:gap-3"
            >
              <div className="bg-background border border-border p-2 md:p-3">
                <div className="text-[8px] md:text-[9px] text-muted-foreground mb-1">
                  Top Category
                </div>
                <div className="text-[14px] md:text-[16px] font-normal text-foreground">
                  Marketing
                </div>
                <div className="text-[7px] md:text-[8px] text-muted-foreground mt-1">
                  $2,100 this month
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3">
                <div className="text-[8px] md:text-[9px] text-muted-foreground mb-1">
                  SaaS Subscriptions
                </div>
                <div className="text-[14px] md:text-[16px] font-normal text-foreground">
                  $1,300
                </div>
                <div className="text-[7px] md:text-[8px] text-muted-foreground mt-1">
                  +12% vs avg
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3">
                <div className="text-[8px] md:text-[9px] text-muted-foreground mb-1">
                  Category Coverage
                </div>
                <div className="text-[14px] md:text-[16px] font-normal text-foreground">
                  85%
                </div>
                <div className="text-[7px] md:text-[8px] text-muted-foreground mt-1">
                  Tagged transactions
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3">
                <div className="text-[8px] md:text-[9px] text-muted-foreground mb-1">
                  Optimization
                </div>
                <div className="text-[14px] md:text-[16px] font-normal text-foreground">
                  $350
                </div>
                <div className="text-[7px] md:text-[8px] text-muted-foreground mt-1">
                  Quick wins
                </div>
              </div>
            </motion.div>
          )}

          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-background border border-border p-2 md:p-3"
            >
              <h3 className="text-[9px] md:text-[10px] text-muted-foreground mb-1.5 md:mb-2">
                Summary
              </h3>
              <p className="text-[9px] md:text-[10px] leading-[13px] md:leading-[14px] text-foreground">
                <span className="lg:hidden">
                  Marketing and SaaS account for most spending. Reduce
                  low-performing ads and consolidate tools to lower costs.
                </span>
                <span className="hidden lg:inline">
                  Marketing and SaaS account for the majority of spending.
                  Reduce low-performing ad sets and consolidate overlapping
                  tools to lower recurring costs. Focus on high-performing
                  channels and eliminate redundant subscriptions to optimize
                  your expense structure.
                </span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
