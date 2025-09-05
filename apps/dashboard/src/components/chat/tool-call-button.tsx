"use client";

import { Button } from "@midday/ui/button";

type ToolCallButtonProps = {
  onTriggerTool: (toolName: string, params: Record<string, any>) => void;
  disabled?: boolean;
};

export function ToolCallButton({
  onTriggerTool,
  disabled,
}: ToolCallButtonProps) {
  const handleRevenueClick = () => {
    onTriggerTool("getRevenue", {
      from: "2024-01-01",
      to: "2024-12-31",
      currency: "SEK",
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleRevenueClick}
        disabled={disabled}
        variant="outline"
        size="sm"
      >
        Get Revenue Report
      </Button>
    </div>
  );
}
