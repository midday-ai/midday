"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { format, parseISO } from "date-fns";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  getBaseBreakdownType,
  isMonthlyBreakdownType,
  METRICS_BREAKDOWN_MONTHLY_PATTERN,
} from "@/lib/metrics-breakdown-constants";

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  "revenue-canvas": "Revenue",
  "balance-sheet-canvas": "Balance Sheet",
  "burn-rate-canvas": "Burn Rate",
  "cash-flow-canvas": "Cash Flow",
  "category-expenses-canvas": "Category Expenses",
  "forecast-canvas": "Forecast",
  "growth-rate-canvas": "Growth Rate",
  "health-report-canvas": "Health Report",
  "invoice-payment-canvas": "Invoice Payment",
  "profit-canvas": "Profit",
  "profit-analysis-canvas": "Profit Analysis",
  "runway-canvas": "Runway",
  "spending-canvas": "Spending",
  "stress-test-canvas": "Stress Test",
  "tax-summary-canvas": "Tax Summary",
  "breakdown-summary-canvas": "Summary",
};

const ARTIFACT_ORDER: Record<string, number> = {
  "breakdown-summary-canvas": 1,
};

/**
 * Extract month key from monthly breakdown type and format as label
 * Uses displayDate from artifact data if available, otherwise parses artifact type
 */
function getMonthlyBreakdownLabel(
  type: string,
  artifactData?: { displayDate?: string; from?: string },
): string {
  // Try to use displayDate from artifact data first
  if (artifactData?.displayDate) {
    try {
      return format(parseISO(artifactData.displayDate), "MMM yyyy");
    } catch {
      // Fall through to parsing artifact type
    }
  }

  // Fallback to using from date
  if (artifactData?.from) {
    try {
      return format(parseISO(artifactData.from), "MMM yyyy");
    } catch {
      // Fall through to parsing artifact type
    }
  }

  // Fallback to parsing artifact type
  const match = type.match(METRICS_BREAKDOWN_MONTHLY_PATTERN);
  if (match) {
    const fullMatch = type.match(/^breakdown-summary-canvas-(\d{4})-(\d{2})$/);
    if (fullMatch) {
      const [, year, month] = fullMatch;
      const date = parseISO(`${year}-${month}-01`);
      return format(date, "MMM yyyy");
    }
  }
  return type;
}

/**
 * Get the base type for ordering (removes monthly suffix)
 */
function getBaseArtifactType(type: string): string {
  return getBaseBreakdownType(type);
}

function getArtifactOrder(type: string): number {
  const baseType = getBaseArtifactType(type);
  return ARTIFACT_ORDER[baseType] ?? 999;
}

/**
 * Get label for an artifact type, handling monthly breakdowns
 * Uses artifact data if provided to get displayDate
 */
function getArtifactLabel(
  type: string,
  artifactData?: { displayDate?: string; from?: string },
): string {
  if (isMonthlyBreakdownType(type)) {
    return getMonthlyBreakdownLabel(type, artifactData);
  }
  return ARTIFACT_TYPE_LABELS[type] || type;
}

export function ArtifactTabs() {
  const [selectedType, setSelectedType] = useQueryState(
    "artifact-type",
    parseAsString,
  );
  const [selectedVersion, setSelectedVersion] = useQueryState(
    "version",
    parseAsInteger.withDefault(0),
  );

  const [data, actions] = useArtifacts({
    value: selectedType ?? undefined,
    onChange: (v: string | null) => setSelectedType(v ?? null),
  });

  const { available, activeType, byType } = data;

  const sortedAvailable = useMemo(() => {
    return [...available].sort((a, b) => {
      const orderA = getArtifactOrder(a);
      const orderB = getArtifactOrder(b);

      // If same order, sort monthly breakdowns chronologically
      if (
        orderA === orderB &&
        isMonthlyBreakdownType(a) &&
        isMonthlyBreakdownType(b)
      ) {
        return a.localeCompare(b); // This will sort YYYY-MM chronologically
      }

      // If same order and both are monthly breakdowns, sort chronologically
      if (orderA === orderB) {
        return 0;
      }

      return orderA - orderB;
    });
  }, [available]);

  const handleTabClick = useCallback(
    (type: string) => {
      actions.setValue(type);
      setSelectedType(type);
    },
    [actions, setSelectedType],
  );

  const handleDismiss = useCallback(
    (e: React.MouseEvent, type: string) => {
      e.stopPropagation();

      // If this is the last tab, close the canvas
      if (sortedAvailable.length === 1) {
        actions.setValue(null);
        setSelectedType(null);
      } else if (type === activeType) {
        // If dismissing the active type, switch to another available type
        const otherTypes = sortedAvailable.filter((t) => t !== type);
        if (otherTypes.length > 0) {
          actions.setValue(otherTypes[0] ?? null);
          setSelectedType(otherTypes[0] ?? null);
        }
      }

      actions.dismiss(type);
    },
    [activeType, sortedAvailable, actions, setSelectedType],
  );

  const handleCloseCanvas = useCallback(() => {
    actions.setValue(null);
    setSelectedType(null);
  }, [actions, setSelectedType]);

  const handleNavigateLeft = useCallback(() => {
    if (sortedAvailable.length <= 1) return;
    const currentIndex = sortedAvailable.indexOf(activeType ?? "");
    if (currentIndex === -1) return;
    const newIndex =
      currentIndex > 0 ? currentIndex - 1 : sortedAvailable.length - 1;
    const newType = sortedAvailable[newIndex];
    if (newType) {
      handleTabClick(newType);
    }
  }, [sortedAvailable, activeType, handleTabClick]);

  const handleNavigateRight = useCallback(() => {
    if (sortedAvailable.length <= 1) return;
    const currentIndex = sortedAvailable.indexOf(activeType ?? "");
    if (currentIndex === -1) return;
    const newIndex =
      currentIndex < sortedAvailable.length - 1 ? currentIndex + 1 : 0;
    const newType = sortedAvailable[newIndex];
    if (newType) {
      handleTabClick(newType);
    }
  }, [sortedAvailable, activeType, handleTabClick]);

  // Keyboard navigation: Left/Right arrows to switch tabs, ESC to close canvas
  useHotkeys(
    "arrowLeft",
    (e) => {
      e.preventDefault();
      handleNavigateLeft();
    },
    {
      enabled: sortedAvailable.length > 1 && Boolean(selectedType),
    },
  );

  useHotkeys(
    "arrowRight",
    (e) => {
      e.preventDefault();
      handleNavigateRight();
    },
    {
      enabled: sortedAvailable.length > 1 && Boolean(selectedType),
    },
  );

  useHotkeys(
    "esc",
    (e) => {
      e.preventDefault();
      handleCloseCanvas();
    },
    {
      enabled: Boolean(selectedType),
    },
  );

  if (sortedAvailable.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 h-10 min-h-10 max-h-10">
      {sortedAvailable.map((type) => {
        const isActive = type === activeType;
        const versions = byType[type] || [];
        const hasMultipleVersions = versions.length > 1;
        // Get artifact data for label (use first version or current)
        const artifactForLabel =
          versions[0]?.payload ||
          (data.current?.type === type ? data.current.payload : undefined);
        const artifactData = artifactForLabel as
          | { displayDate?: string; from?: string }
          | undefined;
        const label = getArtifactLabel(type, artifactData);

        return (
          <div
            key={type}
            className={cn(
              "group flex items-center px-3 h-10 text-xs font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-white dark:bg-[#0c0c0c]"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => handleTabClick(type)}
              className="text-left h-full flex items-center"
              aria-label={`Switch to ${label}`}
            >
              {label}
            </button>
            {hasMultipleVersions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) {
                        handleTabClick(type);
                      }
                    }}
                    className="flex items-center justify-center size-4 ml-1 focus:outline-none"
                    aria-label="Select version"
                  >
                    <Icons.ArrowDropDown
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive ? "opacity-50" : "opacity-30",
                      )}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4}>
                  {versions.map((version, index) => {
                    const payload = version.payload as
                      | { description?: string }
                      | undefined;
                    const description =
                      payload?.description || `Version ${index + 1}`;
                    const isSelected =
                      index === Math.min(selectedVersion, versions.length - 1);
                    return (
                      <DropdownMenuItem
                        key={version.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVersion(index);
                          if (!isActive) {
                            handleTabClick(type);
                          }
                        }}
                        className={cn(
                          "cursor-pointer text-xs",
                          isSelected && "bg-accent",
                        )}
                      >
                        {description}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <button
              type="button"
              className="h-4 w-0 opacity-0 ml-0 group-hover:w-4 group-hover:opacity-100 group-hover:ml-2 focus:w-4 focus:opacity-100 focus:ml-2 transition-all overflow-hidden flex items-center justify-center focus:outline-none text-muted-foreground hover:text-primary"
              onClick={(e) => handleDismiss(e, type)}
              aria-label={`Close ${label}`}
            >
              <Icons.Close className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
