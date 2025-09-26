"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export function SuggestedActions() {
  const { sendMessage } = useChatActions();
  const { setChatId } = useChatInterface();
  const chatId = useChatId();
  const trpc = useTRPC();

  const { data: suggestedActionsData } = useSuspenseQuery(
    trpc.suggestedActions.list.queryOptions({
      limit: 6,
    }),
  );

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

  // UI configuration based on action ID
  const uiConfig: Record<
    string,
    {
      icon: React.ComponentType<any>;
      title: string;
      description: string;
    }
  > = {
    "get-burn-rate-analysis": {
      icon: Icons.Speed,
      title: "Burn rate analysis",
      description: "Analyze my burn rate",
    },
    "latest-transactions": {
      icon: Icons.Transactions,
      title: "Latest transactions",
      description: "Show me my latest transactions",
    },
    "expenses-breakdown": {
      icon: Icons.Amount,
      title: "Expense Breakdown",
      description: "Show me my expense breakdown",
    },
    "balance-sheet": {
      icon: Icons.ReceiptLong,
      title: "Balance Sheet",
      description: "Show me my balance sheet",
    },
  };

  const suggestedActions = suggestedActionsData.actions;

  type SuggestedAction =
    RouterOutputs["suggestedActions"]["list"]["actions"][number];

  return (
    <div className="w-full px-6 py-4 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {suggestedActions.map((action: SuggestedAction) => {
          const config = uiConfig[action.id];
          const Icon = config?.icon;
          const title = config?.title || action.id;
          const description =
            config?.description || `Execute ${action.toolName}`;

          return (
            <button
              key={action.id}
              type="button"
              className={cn(
                "border border-[#e6e6e6] dark:border-[#1d1d1d]",
                "hover:bg-[#f7f7f7] hover:border-[#d0d0d0]",
                "dark:hover:bg-[#131313] dark:hover:border-[#2a2a2a]",
                "px-3 py-2 flex items-center gap-2 cursor-pointer",
                "transition-all duration-300 min-w-fit whitespace-nowrap",
              )}
              onClick={() => {
                handleToolCall({
                  toolName: action.toolName,
                  toolParams: action.toolParams,
                  text: description,
                });
              }}
            >
              {Icon && (
                <Icon className="w-4 h-4 text-[#707070] dark:text-[#666666]" />
              )}
              <span className="text-black dark:text-white text-[12px] font-medium">
                {title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
