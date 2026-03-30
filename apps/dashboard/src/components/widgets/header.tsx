"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Check } from "lucide-react";
import { MetricsFilter } from "@/components/metrics/components/metrics-filter";

interface WidgetsHeaderProps {
  isEditing: boolean;
  onToggleEditing: () => void;
}

export function WidgetsHeader({
  isEditing,
  onToggleEditing,
}: WidgetsHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="gap-2 px-2"
        onClick={onToggleEditing}
      >
        {isEditing ? (
          <Check size={16} className="text-[#666]" />
        ) : (
          <Icons.DashboardCustomize size={16} className="text-[#666]" />
        )}
        <span className="hidden sm:inline">
          {isEditing ? "Done" : "Customize"}
        </span>
      </Button>
      <MetricsFilter />
    </div>
  );
}
