"use client";

import { formatAmount } from "@midday/utils/format";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import type { InsightData } from "@/lib/chat-utils";

interface InsightMessageProps {
  insight: InsightData;
}

/**
 * Animates text appearing character by character for smooth streaming effect
 */
function StreamingText({
  text,
  baseDelay = 0,
  speed = 8, // ms per character
  className,
  onComplete,
}: {
  text: string;
  baseDelay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  // Handle base delay before starting
  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, baseDelay);
    return () => clearTimeout(timer);
  }, [baseDelay]);

  // Stream characters one by one
  useEffect(() => {
    if (!started) return;

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
    if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [started, currentIndex, text, speed, onComplete]);

  const isComplete = currentIndex >= text.length;

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && started && (
        <motion.span
          className="inline-block w-[2px] h-[0.9em] bg-primary/60 ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </span>
  );
}

function formatMetricValue(
  value: number,
  type: string,
  currency: string,
): string {
  if (type.includes("margin") || type.includes("rate")) {
    return `${value.toFixed(1)}%`;
  }
  if (type === "runway_months") {
    return `${value.toFixed(1)} months`;
  }
  if (
    type.includes("hours") ||
    type === "hours_tracked" ||
    type === "unbilled_hours"
  ) {
    return `${value.toFixed(1)}h`;
  }
  if (
    type.includes("invoices") ||
    type.includes("customers") ||
    type === "new_customers" ||
    type === "receipts_matched" ||
    type === "transactions_categorized"
  ) {
    return value.toLocaleString();
  }
  return formatAmount({ amount: value, currency }) ?? value.toLocaleString();
}

function formatChange(
  change: number,
  direction: "up" | "down" | "flat",
  currentValue?: number,
  previousValue?: number,
): string {
  if (direction === "flat" || Math.abs(change) < 0.5) {
    return "steady";
  }

  // Current value is zero (went to zero from something)
  if (
    currentValue === 0 &&
    previousValue !== undefined &&
    previousValue !== 0
  ) {
    return "no activity";
  }

  // Previous was zero, now has value
  if (previousValue === 0 && currentValue !== undefined && currentValue !== 0) {
    return "new activity";
  }

  // Detect sign change (profit to loss or vice versa) with extreme swing
  const signChanged =
    previousValue !== undefined &&
    currentValue !== undefined &&
    ((previousValue > 0 && currentValue < 0) ||
      (previousValue < 0 && currentValue > 0));

  if (signChanged && Math.abs(change) > 200) {
    return change > 0 ? "turned positive" : "turned negative";
  }

  // Cap at 999% for readability
  const cappedChange = Math.min(Math.abs(Math.round(change)), 999);
  const sign = direction === "up" ? "+" : "-";
  return `${sign}${cappedChange}%`;
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut" as const,
    },
  },
};

export function InsightMessage({ insight }: InsightMessageProps) {
  const { content, selectedMetrics, expenseAnomalies, predictions, currency } =
    insight;

  // Sheet hooks for opening details
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setTrackerParams } = useTrackerParams();

  // Track streaming completion states
  const [titleComplete, setTitleComplete] = useState(false);
  const [descriptionComplete, setDescriptionComplete] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // First insight flag comes from backend based on actual history
  // Don't use heuristics - going from 0 revenue to positive is "new activity", not "first insight"
  const isFirstInsight = insight.isFirstInsight ?? false;

  // Get period name for change comparison text
  const periodName =
    insight.periodType === "weekly"
      ? "week"
      : insight.periodType === "monthly"
        ? "month"
        : insight.periodType === "quarterly"
          ? "quarter"
          : "year";

  // Memoize callbacks
  const handleTitleComplete = useCallback(() => setTitleComplete(true), []);
  const handleDescriptionComplete = useCallback(
    () => setDescriptionComplete(true),
    [],
  );
  const handleStoryComplete = useCallback(() => setStoryComplete(true), []);

  // Show metrics after description completes (or title if no description)
  const hasDescription = content?.summary || insight.title;
  useEffect(() => {
    const shouldShowMetrics = hasDescription
      ? descriptionComplete
      : titleComplete;
    if (shouldShowMetrics && !showMetrics) {
      const timer = setTimeout(() => setShowMetrics(true), 150);
      return () => clearTimeout(timer);
    }
  }, [titleComplete, descriptionComplete, hasDescription, showMetrics]);

  // Show story after metrics animation completes
  useEffect(() => {
    if (showMetrics && !showStory) {
      const metricsCount = Math.min(selectedMetrics?.length ?? 0, 4);
      const delay = metricsCount * 100 + 300;
      const timer = setTimeout(() => setShowStory(true), delay);
      return () => clearTimeout(timer);
    }
  }, [showMetrics, showStory, selectedMetrics?.length]);

  // Show actions after story completes (or metrics if no story)
  useEffect(() => {
    const shouldShowActions = content?.story ? storyComplete : showStory;
    if (shouldShowActions && !showActions) {
      const timer = setTimeout(() => setShowActions(true), 150);
      return () => clearTimeout(timer);
    }
  }, [showStory, storyComplete, content?.story, showActions]);

  return (
    <div className="space-y-4 py-2">
      {/* Header */}
      <div>
        <p className="text-[16px] font-medium text-primary mb-4 block">
          <StreamingText
            text={insight.periodLabel}
            baseDelay={0}
            speed={4}
            onComplete={handleTitleComplete}
          />
        </p>
        <AnimatePresence>
          {(content?.summary || insight.title) && titleComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground mt-1"
            >
              <StreamingText
                text={content?.summary || insight.title || ""}
                baseDelay={50}
                speed={3}
                onComplete={handleDescriptionComplete}
              />
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Key Metrics Grid (Highlights) */}
      <AnimatePresence>
        {showMetrics && selectedMetrics && selectedMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-sm text-primary">Key Metrics</p>
            <div className="grid grid-cols-2 gap-3 pb-3">
              {selectedMetrics.slice(0, 4).map((metric, index) => {
                const isRunway = metric.type === "runway_months";
                // For first insight, don't show misleading "vs last week"
                const changeText = isRunway
                  ? "based on 3 month avg"
                  : isFirstInsight
                    ? "this period"
                    : `${formatChange(metric.change, metric.changeDirection, metric.value, metric.previousValue)} vs last ${periodName}`;

                return (
                  <motion.div
                    key={metric.type}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="border border-border bg-background p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {metric.label}
                    </p>
                    <p className="text-lg font-mono tabular-nums text-primary">
                      {formatMetricValue(
                        metric.value,
                        metric.type,
                        metric.currency || currency,
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {changeText}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story (Depth) */}
      <AnimatePresence>
        {showStory && content?.story && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground leading-relaxed"
          >
            <StreamingText
              text={content.story}
              baseDelay={50}
              speed={3}
              onComplete={handleStoryComplete}
            />
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <AnimatePresence>
        {showActions && content?.actions && content.actions.length > 0 && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <p className="text-sm text-primary">Recommended actions</p>
            <ul className="space-y-1">
              {content.actions.map((action, i) => {
                const hasLink = action.entityId && action.entityType;
                const handleClick = () => {
                  if (!action.entityId || !action.entityType) return;

                  switch (action.entityType) {
                    case "invoice":
                      setInvoiceParams({
                        invoiceId: action.entityId,
                        type: "details",
                      });
                      break;
                    case "project":
                      setTrackerParams({
                        projectId: action.entityId,
                        update: true,
                      });
                      break;
                    // Future: handle "customer", "transaction", etc.
                  }
                };

                return (
                  <motion.li
                    key={action.text}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span>•</span>
                    {hasLink ? (
                      <button
                        type="button"
                        onClick={handleClick}
                        className="text-left hover:text-primary underline-offset-2 hover:underline transition-colors"
                      >
                        {action.text}
                      </button>
                    ) : (
                      <span>{action.text}</span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Alert */}
      <AnimatePresence>
        {showActions &&
          insight.activity?.invoicesOverdue != null &&
          insight.activity.invoicesOverdue > 0 && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="text-sm"
            >
              <span className="font-medium">Needs attention:</span>{" "}
              <span className="text-muted-foreground">
                {insight.activity.invoicesOverdue} overdue invoice
                {insight.activity.invoicesOverdue > 1 ? "s" : ""}
                {insight.activity.overdueAmount != null &&
                  insight.activity.overdueAmount > 0 && (
                    <span>
                      {" "}
                      (
                      {formatAmount({
                        amount: insight.activity.overdueAmount,
                        currency,
                      })}
                      )
                    </span>
                  )}
              </span>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Expense Alerts (only spikes) */}
      <AnimatePresence>
        {showActions &&
          expenseAnomalies &&
          expenseAnomalies.filter(
            (ea) => ea.type === "category_spike" || ea.type === "new_category",
          ).length > 0 && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <p className="text-sm text-primary">Expense alerts</p>
              <ul className="space-y-1">
                {expenseAnomalies
                  .filter(
                    (ea) =>
                      ea.type === "category_spike" ||
                      ea.type === "new_category",
                  )
                  .slice(0, 3)
                  .map((ea, i) => (
                    <motion.li
                      key={ea.categoryName}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span>•</span>
                      <span>
                        {ea.type === "new_category" ? (
                          <>
                            New: {ea.categoryName} (
                            {formatAmount({
                              amount: ea.currentAmount,
                              currency: ea.currency,
                            })}
                            )
                          </>
                        ) : (
                          <>
                            {ea.categoryName} up {ea.change}% to{" "}
                            {formatAmount({
                              amount: ea.currentAmount,
                              currency: ea.currency,
                            })}
                          </>
                        )}
                      </span>
                    </motion.li>
                  ))}
              </ul>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Next Week Predictions */}
      <AnimatePresence>
        {showActions &&
          predictions?.invoicesDue &&
          predictions.invoicesDue.count > 0 && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <p className="text-sm text-primary">Next week</p>
              <p className="text-sm text-muted-foreground">
                {predictions.invoicesDue.count} invoice
                {predictions.invoicesDue.count > 1 ? "s" : ""} due (
                {formatAmount({
                  amount: predictions.invoicesDue.totalAmount,
                  currency: predictions.invoicesDue.currency,
                })}
                )
              </p>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
