"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";

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

  // Mutation for tracking action usage
  const trackUsageMutation = useMutation(
    trpc.suggestedActions.trackUsage.mutationOptions(),
  );

  const handleToolCall = (params: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
    actionId: string;
  }) => {
    if (!chatId) return;

    trackUsageMutation.mutate({ actionId: params.actionId });

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
      description: "Show me my burn rate visual analytics",
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
    "get-spending": {
      icon: Icons.ShowChart,
      title: "Spending Analysis",
      description: "Show me my spending analysis",
    },
    "get-runway": {
      icon: Icons.Speed,
      title: "Runway",
      description: "Show me my runway",
    },
    "get-cash-flow": {
      icon: Icons.TrendingUp,
      title: "Cash Flow",
      description: "Show me my cash flow",
    },
    "get-revenue-summary": {
      icon: Icons.Currency,
      title: "Revenue Summary",
      description: "Show me my revenue summary",
    },
    "get-account-balances": {
      icon: Icons.Accounts,
      title: "Account Balances",
      description: "Show me my account balances",
    },
    "get-invoices": {
      icon: Icons.Invoice,
      title: "Invoices",
      description: "Show me my invoices",
    },
    "get-customers": {
      icon: Icons.Customers,
      title: "Customers",
      description: "Show me my customers",
    },
    "get-profit-analysis": {
      icon: Icons.PieChart,
      title: "Profit & Loss",
      description: "Show me my profit & loss statement",
    },
    "get-invoice-payment-analysis": {
      icon: Icons.Invoice,
      title: "Payment Analysis",
      description: "Show me my invoice payment analysis",
    },
    "get-tax-summary": {
      icon: Icons.Tax,
      title: "Tax Summary",
      description: "Show me my tax summary",
    },
    "get-business-health-score": {
      icon: Icons.Info,
      title: "Business Health",
      description: "Show me my business health score",
    },
    "get-forecast": {
      icon: Icons.TrendingUp,
      title: "Revenue Forecast",
      description: "Show me my revenue forecast",
    },
    "get-cash-flow-stress-test": {
      icon: Icons.Speed,
      title: "Stress Test",
      description: "Show me my cash flow stress test",
    },
    "get-expenses": {
      icon: Icons.Amount,
      title: "Expenses",
      description: "Show me my expenses",
    },
    "get-growth-rate": {
      icon: Icons.TrendingUp,
      title: "Growth Rate",
      description: "Show me my growth rate analysis",
    },
  };

  const suggestedActions = suggestedActionsData.actions;

  type SuggestedAction =
    RouterOutputs["suggestedActions"]["list"]["actions"][number];

  return (
    <div className="w-[calc(100%+16px)] md:w-full -mx-4 md:mx-0 md:px-6 mt-10 mb-8 flex items-center justify-center">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide w-full md:w-auto pl-4 md:pl-0">
        {suggestedActions.map((action: SuggestedAction, index) => {
          const config = uiConfig[action.id];
          const Icon = config?.icon;
          const title = config?.title || action.id;
          const description =
            config?.description || `Execute ${action.toolName}`;
          const isLast = index === suggestedActions.length - 1;

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
                "flex-shrink-0",
                isLast && "mr-4 md:mr-0",
              )}
              onClick={() => {
                handleToolCall({
                  toolName: action.toolName,
                  toolParams: action.toolParams,
                  text: description,
                  actionId: action.id,
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
