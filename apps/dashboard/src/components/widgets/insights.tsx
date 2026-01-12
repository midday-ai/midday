"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BaseWidget } from "./base";

type InsightCard = {
  id: string;
  periodLabel: string;
  periodType: string;
  periodNumber: number;
  periodYear: number;
  goodNews?: string;
  generatedAt: string | null;
};

function StackedCards({ insights }: { insights: InsightCard[] }) {
  if (insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80px] text-sm text-[#666666]">
        No insights yet
      </div>
    );
  }

  // Show up to 3 stacked cards
  const displayInsights = insights.slice(0, 3);

  return (
    <div className="relative h-[80px] mt-2">
      {displayInsights.map((insight, index) => (
        <div
          key={insight.id}
          className={cn(
            "absolute inset-x-0 bg-background border border-border/50 rounded-sm p-2 transition-all duration-200",
            index === 0 && "z-30 shadow-sm",
            index === 1 && "z-20 top-2 scale-[0.95] opacity-80",
            index === 2 && "z-10 top-4 scale-[0.90] opacity-60",
          )}
          style={{
            transform: `translateY(${index * 4}px) scale(${1 - index * 0.03})`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium truncate">
              {insight.periodLabel}
            </span>
            {insight.generatedAt && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(insight.generatedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          {index === 0 && insight.goodNews && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
              {insight.goodNews}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function InsightsWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  const { data, isLoading } = useQuery({
    ...trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 4,
    }),
    // Insights are generated weekly, so cache for 1 hour
    staleTime: 60 * 60 * 1000,
  });

  const insights: InsightCard[] =
    data?.data?.map((insight) => ({
      id: insight.id,
      periodLabel: insight.periodLabel ?? `Week ${insight.periodNumber}`,
      periodType: insight.periodType,
      periodNumber: insight.periodNumber,
      periodYear: insight.periodYear,
      goodNews: insight.content?.goodNews,
      generatedAt: insight.generatedAt?.toISOString() ?? null,
    })) ?? [];

  const latestInsight = insights[0];

  const handleViewInsights = () => {
    if (!chatId || !latestInsight) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: `Show me my ${latestInsight.periodType} summary for ${latestInsight.periodLabel}`,
        },
      ],
      metadata: {
        toolCall: {
          toolName: "getInsights",
          toolParams: {
            periodType: latestInsight.periodType,
            periodNumber: latestInsight.periodNumber,
            year: latestInsight.periodYear,
          },
        },
      },
    });
  };

  const getDescription = () => {
    if (isLoading) {
      return <p className="text-sm text-[#666666]">Loading insights...</p>;
    }

    if (insights.length === 0) {
      return (
        <p className="text-sm text-[#666666]">
          Your weekly insights will appear here once generated.
        </p>
      );
    }

    return <StackedCards insights={insights} />;
  };

  return (
    <BaseWidget
      title="Weekly Insights"
      icon={<Icons.AI className="size-4" />}
      description={getDescription()}
      actions={latestInsight ? "View latest insights" : "Check back Monday"}
      onClick={latestInsight ? handleViewInsights : undefined}
    />
  );
}
