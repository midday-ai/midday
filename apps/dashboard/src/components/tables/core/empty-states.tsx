"use client";

import { Button } from "@midday/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Title to display */
  title: string;
  /** Description text (can include line breaks with <br />) */
  description: ReactNode;
  /** Label for the action button */
  actionLabel: string;
  /** Callback when action button is clicked */
  onAction: () => void;
}

/**
 * Generic empty state component for tables
 * Used when there is no data to display
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">{title}</h2>
          <p className="text-[#606060] text-sm">{description}</p>
        </div>

        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

interface NoResultsProps {
  /** Callback to clear filters */
  onClear: () => void;
}

/**
 * No results state for filtered tables
 * Used when filters return no matches
 */
export function NoResults({ onClear }: NoResultsProps) {
  return (
    <EmptyState
      title="No results"
      description="Try another search, or adjusting the filters"
      actionLabel="Clear filters"
      onAction={onClear}
    />
  );
}
