"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdOutlineAccountBalance,
  MdOutlineDescription,
  MdOutlineTimer,
  MdOutlineTrendingUp,
} from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
  timer: MdOutlineTimer,
  account_balance: MdOutlineAccountBalance,
  trending_up: MdOutlineTrendingUp,
  description: MdOutlineDescription,
};

function DynamicIcon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = dynamicIconMap[name];
  return Icon ? <Icon className={className} size={size} /> : null;
}

interface Widget {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  value?: string;
  content?: string;
  action: string;
  type: "metric" | "chart" | "bar-chart" | "line-chart" | "expenses";
}

const widgets: Widget[] = [
  {
    id: "cash-runway",
    title: "Cash Runway",
    icon: "timer",
    subtitle: "Your cash runway in months",
    value: "13 months",
    action: "View runway",
    type: "metric",
  },
  {
    id: "cash-flow",
    title: "Cash Flow",
    icon: "account_balance",
    subtitle: "Net cash position · Fiscal year",
    value: "+$47,283",
    action: "View cash flow analysis",
    type: "metric",
  },
  {
    id: "account-balances",
    title: "Account Balances",
    icon: "account_balance",
    subtitle: "Combined balance from 2 accounts",
    value: "$78,642",
    action: "View account balances",
    type: "metric",
  },
  {
    id: "profit-loss",
    title: "Profit & Loss",
    icon: "timer",
    subtitle: "$43,156 · Fiscal year · Net",
    action: "See detailed analysis",
    type: "bar-chart",
  },
  {
    id: "revenue-summary",
    title: "Revenue Summary",
    icon: "trending_up",
    subtitle: "Net revenue · Fiscal year",
    value: "$124,789",
    action: "View revenue trends",
    type: "metric",
  },
  {
    id: "outstanding-invoices",
    title: "Outstanding Invoices",
    icon: "description",
    subtitle: "",
    content: "You currently have 2 unpaid and $4,237 in outstanding invoices",
    action: "View all invoices",
    type: "metric",
  },
];

export function WidgetsAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWidgets, setShowWidgets] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(
    widgets.map((w) => w.id),
  );

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const _intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp!;
    }
    return shuffled;
  };

  useEffect(() => {
    if (!shouldPlay) return;

    const initialOrder = widgets.map((w) => w.id);
    setCardOrder(initialOrder);
    clearAllTimeouts();

    const timer = setTimeout(() => setShowWidgets(true), 0);
    timeoutRefs.current.push(timer);

    const wiggleTimer = setTimeout(() => {
      setIsWiggling(true);
    }, 800);
    timeoutRefs.current.push(wiggleTimer);

    const shuffleTimer = setTimeout(() => {
      setCardOrder(shuffleArray(initialOrder));

      const stopTimer = setTimeout(() => {
        setIsWiggling(false);
      }, 600);
      timeoutRefs.current.push(stopTimer);
    }, 2000);
    timeoutRefs.current.push(shuffleTimer);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;
    if (doneTimer) timeoutRefs.current.push(doneTimer);

    return () => {
      clearAllTimeouts();
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  const renderBarChart = () => {
    const barPairs = [
      [16, 29],
      [36, 29],
      [16, 29],
      [36, 10],
      [16, 29],
      [16, 10],
    ];

    return (
      <div className="flex items-end justify-between h-[49px] relative mt-2 md:mt-3">
        {barPairs.map((pair, pairIdx) => (
          <div
            key={`bar-pair-${pair[0]}-${pair[1]}-${pairIdx}`}
            className="flex gap-1.5 md:gap-2 items-end justify-center flex-1"
          >
            <motion.div
              className="bg-muted-foreground w-1.5 md:w-2"
              style={{ height: `${pair[0]}px` }}
              initial={{ height: 0 }}
              animate={{ height: showWidgets ? `${pair[0]}px` : 0 }}
              transition={{ duration: 0.3, delay: pairIdx * 0.05 }}
            />
            <motion.div
              className="bg-foreground w-1.5 md:w-2"
              style={{ height: `${pair[1]}px` }}
              initial={{ height: 0 }}
              animate={{ height: showWidgets ? `${pair[1]}px` : 0 }}
              transition={{ duration: 0.3, delay: pairIdx * 0.05 + 0.05 }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    return (
      <div className="h-[60px] md:h-[80px] w-full mt-2 md:mt-3 relative">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 60"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <motion.polyline
            points="0,45 30,50 60,48 90,42 120,40 150,38 180,35 200,32"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: showWidgets ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
        </svg>
      </div>
    );
  };

  const renderExpenses = () => {
    const expenses = [
      { name: "Salary", value: "192,0k", width: 85 },
      { name: "Taxes", value: "120,4k", width: 55 },
      { name: "Software", value: "86,9k", width: 40 },
    ];

    return (
      <div className="flex flex-col gap-2 md:gap-3 mt-2 md:mt-3">
        {expenses.map((expense, idx) => (
          <motion.div
            key={expense.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: showWidgets ? 1 : 0, x: showWidgets ? 0 : -10 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <span className="text-[10px] md:text-[12px] text-foreground whitespace-nowrap shrink-0">
              {expense.name}
            </span>
            <div className="flex-1 h-1.5 md:h-2 bg-muted/20 relative overflow-hidden min-w-0">
              <motion.div
                className={`h-full ${
                  idx === 0
                    ? "bg-foreground"
                    : idx === 1
                      ? "bg-muted-foreground"
                      : "bg-muted-foreground/60"
                }`}
                initial={{ width: 0 }}
                animate={{ width: showWidgets ? `${expense.width}%` : 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 + 0.2 }}
              />
            </div>
            <span className="text-[10px] md:text-[12px] text-foreground whitespace-nowrap shrink-0">
              {expense.value}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative bg-background p-2 md:p-3"
    >
      {/* Widget Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 md:gap-5 relative auto-rows-fr">
        {cardOrder.map((widgetId, _displayIdx) => {
          const widget = widgets.find((w) => w.id === widgetId)!;
          const originalIdx = widgets.findIndex((w) => w.id === widgetId);

          return (
            <motion.div
              key={widgetId}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: showWidgets ? 1 : 0,
                y: showWidgets ? 0 : 12,
                rotate: isWiggling ? [0, -1, 1, -1, 1, 0] : 0,
              }}
              transition={{
                opacity: { duration: 0.3, delay: originalIdx * 0.05 },
                y: {
                  duration: 0.3,
                  delay: originalIdx * 0.05,
                  ease: "easeOut",
                },
                rotate: isWiggling
                  ? {
                      duration: 0.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : { duration: 0.3 },
                layout: {
                  duration: 0.6,
                  ease: "easeInOut",
                },
              }}
              layout
              className="bg-secondary border border-border p-2 md:p-3 lg:p-4 flex flex-col h-full"
            >
              {/* Title with icon */}
              <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-2">
                <DynamicIcon
                  name={widget.icon}
                  className="text-muted-foreground w-[10px] h-[10px] md:w-[14px] md:h-[14px]"
                  size={14}
                />
                <span className="text-[9px] md:text-[12px] text-foreground font-normal">
                  {widget.title}
                </span>
              </div>

              {/* Subtitle */}
              {widget.subtitle && (
                <p className="text-[9px] md:text-[10px] text-muted-foreground mb-2 md:mb-3">
                  {widget.subtitle}
                </p>
              )}

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                {widget.value && (
                  <div className="mb-2 md:mb-3">
                    <div className="text-[14px] md:text-[18px] lg:text-[22px] text-foreground font-normal leading-tight">
                      {widget.value}
                    </div>
                  </div>
                )}

                {widget.content && (
                  <p className="text-[10px] md:text-[12px] lg:text-[14px] text-muted-foreground leading-tight mb-2 md:mb-3">
                    {widget.content
                      .split(/(\d+|\d+ [\d,]+ kr)/)
                      .map((part, idx) => {
                        if (
                          part.match(/^\d+/) ||
                          part.match(/^\d+ [\d,]+ kr/)
                        ) {
                          return (
                            <span
                              key={`${widget.id}-part-${part}-${idx}`}
                              className="text-foreground"
                            >
                              {part}
                            </span>
                          );
                        }
                        return (
                          <span key={`${widget.id}-part-${part}-${idx}`}>
                            {part}
                          </span>
                        );
                      })}
                  </p>
                )}

                {widget.type === "bar-chart" && renderBarChart()}
                {widget.type === "line-chart" && renderLineChart()}
                {widget.type === "expenses" && renderExpenses()}

                {/* Action link */}
                <p className="text-[9px] md:text-[10px] text-muted-foreground mt-auto pt-2">
                  {widget.action}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
