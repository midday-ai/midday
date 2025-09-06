"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { endOfMonth, subMonths } from "date-fns";
import {
  MdBarChart,
  MdContentCopy,
  MdHealthAndSafety,
  MdSchedule,
  MdTask,
  MdTrendingUp,
} from "react-icons/md";

type Props = {
  handleToolCall: ({
    toolName,
    toolParams,
    text,
  }: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
  }) => void;
};

export function SuggestedActions({ handleToolCall }: Props) {
  const SUGGESTED_ACTIONS = [
    {
      id: "revenue",
      title: "Revenue",
      icon: MdBarChart,
      onClick: () => {
        handleToolCall({
          toolName: "getRevenue",
          toolParams: {
            from: subMonths(new Date(), 12).toISOString(),
            to: endOfMonth(new Date()).toISOString(),
            currency: "SEK",
          },
          text: "Get my revenue data",
        });
      },
    },
    {
      id: "duplicate-invoice",
      title: "Duplicate invoice",
      icon: MdContentCopy,
      onClick: () => {
        handleToolCall({
          toolName: "duplicateInvoice",
          toolParams: {},
          text: "Duplicate invoice",
        });
      },
    },
    {
      id: "expenses",
      title: "Expenses",
      icon: MdTrendingUp,
      onClick: () => {
        handleToolCall({
          toolName: "getExpenses",
          toolParams: {},
          text: "Get my expenses data",
        });
      },
    },
    {
      id: "time-track",
      title: "Time track",
      icon: MdSchedule,
      onClick: () => {
        handleToolCall({
          toolName: "getTimeTrack",
          toolParams: {},
          text: "Get my time track data",
        });
      },
    },
    {
      id: "new-task",
      title: "New task",
      icon: MdTask,
      onClick: () => {
        handleToolCall({
          toolName: "newTask",
          toolParams: {},
          text: "New task",
        });
      },
    },
    {
      id: "health-report",
      title: "Health report",
      icon: MdHealthAndSafety,
      onClick: () => {
        handleToolCall({
          toolName: "healthReport",
          toolParams: {},
          text: "Health report",
        });
      },
    },
  ];

  return (
    <div className="w-full px-6 py-4 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {SUGGESTED_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              className={cn(
                "flex items-center gap-3 px-4 py-3 min-w-fit",
                "text-sm font-regular text-foreground",
                "whitespace-nowrap",
              )}
              onClick={action.onClick}
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              {action.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
