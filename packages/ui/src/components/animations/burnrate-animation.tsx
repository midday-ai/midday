"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return { isMobile, isTablet };
}

export function BurnrateAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useIsMobile();
  const [showGraph, setShowGraph] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [_pathLength, setPathLength] = useState(0);
  const [areaOpacity, setAreaOpacity] = useState(0);
  const [showAverageLine, setShowAverageLine] = useState(false);

  useEffect(() => {
    if (!shouldPlay) return;

    const graphTimer = setTimeout(() => setShowGraph(true), 0);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(graphTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  useEffect(() => {
    if (showGraph) {
      setPathLength(1);
      setAreaOpacity(1);
      setTimeout(() => {
        setShowAverageLine(true);
      }, 0);

      const metricsTimer = setTimeout(() => setShowMetrics(true), 900);
      const summaryTimer = setTimeout(() => setShowSummary(true), 1500);
      return () => {
        clearTimeout(metricsTimer);
        clearTimeout(summaryTimer);
      };
    }
  }, [showGraph]);

  const dataPoints = [
    { month: "Oct", value: 5.0 },
    { month: "Nov", value: 6.2 },
    { month: "Dec", value: 3.5 },
    { month: "Jan", value: 6.8 },
    { month: "Feb", value: 6.0 },
    { month: "Mar", value: 7.2 },
    { month: "Apr", value: 6.5 },
  ];

  const maxValue = 15;
  const averageValue = 6;
  const graphWidth = 500;
  const graphHeight = isMobile ? 180 : isTablet ? 240 : 280;
  const paddingLeft = 30;
  const paddingRight = 30;
  const paddingTop = isMobile ? 20 : 30;
  const paddingBottom = isMobile ? 20 : 30;
  const chartWidth = graphWidth - paddingLeft - paddingRight;
  const chartHeight = graphHeight - paddingTop - paddingBottom;

  const points = dataPoints.map((point, idx) => {
    const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1;
    const x = paddingLeft + (idx / divisor) * chartWidth;
    const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight;
    return { x, y, month: point.month, value: point.value };
  });

  const pathData = points.reduce((path, p, idx) => {
    if (idx === 0) {
      return `M ${p.x} ${p.y}`;
    }
    const prevPoint = points[idx - 1];
    const isDipPoint = idx === 2;
    const isBeforeDip = idx === 1;
    const isAfterDip = idx === 3;

    if (isDipPoint || isBeforeDip || isAfterDip) {
      return `${path} L ${p.x} ${p.y}`;
    }
    if (!prevPoint) {
      return path;
    }
    const controlX = (prevPoint.x + p.x) / 2;
    const controlY =
      prevPoint.y < p.y
        ? prevPoint.y + (p.y - prevPoint.y) * 0.3
        : prevPoint.y - (prevPoint.y - p.y) * 0.3;
    return `${path} Q ${controlX} ${controlY}, ${p.x} ${p.y}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath =
    lastPoint && firstPoint
      ? `${pathData} L ${lastPoint.x} ${paddingTop + chartHeight} L ${firstPoint.x} ${paddingTop + chartHeight} Z`
      : "";

  const averageY =
    paddingTop + chartHeight - (averageValue / maxValue) * chartHeight;

  const gridLines = [0, 3, 6, 9, 12, 15].map((value) => {
    const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
    return { y, value };
  });

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      {/* Header */}
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] md:text-[14px] font-sans text-foreground">
            Monthly Burn Rate
          </h3>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div
                className="w-2 h-2 bg-foreground"
                style={{ borderRadius: "0" }}
              />
              <span className="text-[8px] md:text-[9px] font-sans text-muted-foreground">
                Current
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <svg width="12" height="2" className="overflow-visible">
                <line
                  x1="0"
                  y1="1"
                  x2="12"
                  y2="1"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </svg>
              <span className="text-[8px] md:text-[9px] font-sans text-muted-foreground">
                Average
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-0 md:pb-1 overflow-hidden flex flex-col">
        <div className="flex flex-col gap-4 pt-2 md:pt-4">
          {/* Graph Section */}
          <div className="bg-background border border-border px-2 md:px-4 flex flex-col h-[180px] sm:h-[240px] md:h-[280px] relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showGraph ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full"
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                preserveAspectRatio="none"
                className="overflow-visible"
              >
                <defs>
                  <pattern
                    id="burnRatePattern"
                    x="0"
                    y="0"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="8" height="8" fill="transparent" />
                    <path
                      d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                      stroke="hsl(var(--border))"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                  </pattern>
                </defs>

                {gridLines.map((grid) => (
                  <line
                    key={`grid-h-${grid.value}`}
                    x1={paddingLeft}
                    y1={grid.y}
                    x2={graphWidth - paddingRight}
                    y2={grid.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.3"
                  />
                ))}

                {points.map((point) => (
                  <line
                    key={`grid-v-${point.month}`}
                    x1={point.x}
                    y1={paddingTop}
                    x2={point.x}
                    y2={graphHeight - paddingBottom}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.3"
                  />
                ))}

                <motion.line
                  x1={paddingLeft}
                  y1={averageY}
                  x2={graphWidth - paddingRight}
                  y2={averageY}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showAverageLine ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                />

                {areaPath && (
                  <motion.path
                    d={areaPath}
                    fill="url(#burnRatePattern)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: areaOpacity }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  />
                )}

                <path
                  d={pathData}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </motion.div>
          </div>

          {/* Metrics Grid */}
          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-2 md:gap-3"
            >
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Current Monthly Burn
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  $7,500
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  +5.6% vs last month
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Runway Remaining
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  10.7 months
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  Below recommended 12+ months
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Average Burn Rate
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  $6,000
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  Over last 6 months
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Personnel Costs
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  65%
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  $4,875 of monthly burn
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Section */}
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-background border border-border p-2 md:p-3 select-none"
            >
              <h3 className="text-[9px] md:text-[10px] font-sans text-muted-foreground mb-1.5 md:mb-2">
                Summary
              </h3>
              <p className="text-[9px] md:text-[10px] leading-[13px] md:leading-[14px] font-sans text-foreground">
                Burn rate increased 67% over 6 months ($4,500 to $7,500), driven
                by personnel costs (65% of expenses). Current runway of 10.7
                months is below the recommended 12+ months, requiring cost
                optimization or additional funding.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
