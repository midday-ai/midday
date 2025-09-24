"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { endOfMonth, subMonths } from "date-fns";
import {
  MdBarChart,
  MdHealthAndSafety,
  MdReceipt,
  MdSchedule,
  MdTask,
  MdTrendingUp,
} from "react-icons/md";

export function SuggestedActions() {
  const { sendMessage } = useChatActions();
  const { setChatId } = useChatInterface();
  const chatId = useChatId();

  const handleToolCall = (params: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
  }) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: params.text }],
      metadata: {
        toolCall: {
          toolName: params.toolName,
          toolParams: params.toolParams,
        },
      },
    });
  };

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
            showCanvas: true,
          },
          text: "Get my revenue data",
        });
      },
    },
    {
      id: "burn-rate",
      title: "Burn rate",
      icon: MdHealthAndSafety,
      onClick: () => {
        handleToolCall({
          toolName: "getBurnRate",
          toolParams: {
            showCanvas: true,
          },
          text: "Analyze my burn rate",
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
          toolParams: {
            showCanvas: true,
          },
          text: "Get my expenses data",
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
    {
      id: "latest-transactions",
      title: "Latest transactions",
      icon: MdReceipt,
      onClick: () => {
        handleToolCall({
          toolName: "getTransactions",
          toolParams: {
            pageSize: 10,
            sort: ["date", "desc"],
          },
          text: "Show me my latest transactions",
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
