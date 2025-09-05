"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdContentCopy,
  MdHealthAndSafety,
  MdSchedule,
  MdTask,
  MdTrendingUp,
} from "react-icons/md";

const SUGGESTED_ACTIONS = [
  {
    id: "revenue",
    title: "Revenue",
    icon: MdBarChart,
  },
  {
    id: "duplicate-invoice",
    title: "Duplicate invoice",
    icon: MdContentCopy,
  },
  {
    id: "expenses",
    title: "Expenses",
    icon: MdTrendingUp,
  },
  {
    id: "time-track",
    title: "Time track",
    icon: MdSchedule,
  },
  {
    id: "new-task",
    title: "New task",
    icon: MdTask,
  },
  {
    id: "health-report",
    title: "Health report",
    icon: MdHealthAndSafety,
  },
];

const VISIBLE_COUNT = 6;

export function SuggestedActions() {
  const [visibleActions, setVisibleActions] = useState(
    SUGGESTED_ACTIONS.slice(0, VISIBLE_COUNT),
  );

  // Randomize actions on mount
  useEffect(() => {
    const shuffled = [...SUGGESTED_ACTIONS].sort(() => Math.random() - 0.5);
    setVisibleActions(shuffled.slice(0, VISIBLE_COUNT));
  }, []);

  return (
    <div className="w-full px-6 py-4 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {visibleActions.map((action) => {
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
