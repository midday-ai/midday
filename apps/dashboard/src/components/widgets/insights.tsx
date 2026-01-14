"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef } from "react";
import { WidgetSkeleton } from "./widget-skeleton";

/**
 * Derive period label from period type, year, and number
 */
function getPeriodLabel(
  periodType: string,
  periodYear: number,
  periodNumber: number,
): string {
  switch (periodType) {
    case "weekly":
      return `Week ${periodNumber}, ${periodYear}`;
    case "monthly": {
      const monthName = format(new Date(periodYear, periodNumber - 1), "MMMM");
      return `${monthName} ${periodYear}`;
    }
    case "quarterly":
      return `Q${periodNumber} ${periodYear}`;
    case "yearly":
      return `${periodYear} Year in Review`;
    default:
      return `${periodType} ${periodNumber}, ${periodYear}`;
  }
}

type InsightCard = {
  id: string;
  periodLabel: string;
  periodType: string;
  periodNumber: number;
  periodYear: number;
  title?: string;
  opener?: string;
  story?: string;
  generatedAt: string | null;
  hasAudio?: boolean;
};

function InsightCard({
  insight,
  index,
  totalCards,
  onDismiss,
  onListenClick,
}: {
  insight: InsightCard;
  index: number;
  totalCards: number;
  onDismiss: (id: string) => void;
  onListenClick: (insight: InsightCard) => void;
}) {
  const isTopCard = index === 0;

  // Calculate rotation and offset based on position in stack
  const baseRotation = isTopCard ? -1.5 : index * 0.5;
  const translateY = isTopCard ? -1 : index * 4;
  const translateX = isTopCard ? 2 : 0;
  const opacity = isTopCard ? 1 : 1 - index * 0.2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute inset-0 h-[210px]"
      style={{ zIndex: totalCards - index }}
    >
      <div
        className={cn(
          "absolute inset-0 h-[210px] p-4 flex flex-col justify-between",
          "dark:bg-[#131313] bg-[#f7f7f7]",
          "dark:border-[#1d1d1d] border-[#e6e6e6] border",
          "dark:shadow-[0_6px_16px_rgba(0,0,0,0.3)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]",
          "transition-all duration-300",
          isTopCard && "group-hover:-rotate-[2.5deg]",
        )}
        style={{
          transform: `rotate(${baseRotation}deg) translateX(${translateX}px) translateY(${translateY}px)`,
          opacity,
        }}
      >
        {isTopCard && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-[12px] dark:text-[#666666] text-[#707070] font-medium">
                    {insight.periodLabel}
                  </h4>
                </div>
                {insight.generatedAt && (
                  <span className="text-[10px] dark:text-[#4a4a4a] text-[#999999]">
                    {formatDistanceToNow(new Date(insight.generatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <p className="text-[14px] leading-[19px] dark:text-white text-black mb-8 line-clamp-4">
                {insight.title}{" "}
              </p>
            </div>
            <div className="flex items-end justify-between text-[12px] text-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(insight.id);
                }}
                className="dark:text-[#666666] text-[#707070] transition-colors order-2 dark:hover:text-white hover:text-black"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onListenClick(insight);
                }}
                className={cn(
                  "flex items-center gap-1",
                  "dark:text-[rgba(102,102,102,0.5)] text-[rgba(112,112,112,0.5)]",
                  "transition-colors order-1",
                  "dark:hover:text-white hover:text-black cursor-pointer",
                )}
              >
                <Icons.UnMute className="size-3" />
                Listen to breakdown
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function InsightsWidget() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Fetch insights list (excluding dismissed)
  const { data, isLoading } = useQuery(
    trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 5,
    }),
  );

  // Fetch to check if any insights exist at all (including dismissed)
  // This helps differentiate between "no insights yet" and "all dismissed"
  const { data: allInsightsData } = useQuery(
    trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 1,
      includeDismissed: true,
    }),
  );

  // Mutation to mark insight as read (fire and forget)
  const { mutate: markAsRead } = useMutation(
    trpc.insights.markAsRead.mutationOptions(),
  );

  // Mutation to dismiss insight
  const { mutate: dismissInsight } = useMutation(
    trpc.insights.dismiss.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.insights.list.queryKey(),
        });
      },
    }),
  );

  // Realtime subscription for insight changes
  useRealtime({
    channelName: "insights_realtime",
    table: "insights",
    filter: user?.teamId ? `team_id=eq.${user.teamId}` : undefined,
    onEvent: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.insights.list.queryKey(),
      });
    },
  });

  const insights: InsightCard[] =
    data?.data?.map((insight) => ({
      id: insight.id,
      periodLabel: getPeriodLabel(
        insight.periodType,
        insight.periodYear,
        insight.periodNumber,
      ),
      periodType: insight.periodType,
      periodNumber: insight.periodNumber,
      periodYear: insight.periodYear,
      title: insight.title ?? undefined,
      opener: insight.content?.opener,
      story: insight.content?.story,
      generatedAt: insight.generatedAt?.toISOString() ?? null,
      hasAudio: !!insight.audioPath,
    })) ?? [];

  const handleDismiss = useCallback(
    (id: string) => {
      dismissInsight({ id });
    },
    [dismissInsight],
  );

  const handleListenClick = useCallback(
    async (insight: InsightCard) => {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (!insight.hasAudio) {
        // Fallback to chat if no audio
        if (chatId) {
          setChatId(chatId);
          sendMessage({
            role: "user",
            parts: [
              {
                type: "text",
                text: `Read me my ${insight.periodType} summary for ${insight.periodLabel}`,
              },
            ],
          });
        }
        return;
      }

      try {
        const result = await queryClient.fetchQuery(
          trpc.insights.audioUrl.queryOptions({ id: insight.id }),
        );

        if (result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            audioRef.current = null;
          };

          audio.play();
        }
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    },
    [chatId, setChatId, sendMessage, queryClient, trpc],
  );

  const handleCardClick = useCallback(() => {
    const insight = insights[0];
    if (!insight || !chatId) return;

    // Mark as read when user clicks on the card
    if (!markedAsReadRef.current.has(insight.id)) {
      markedAsReadRef.current.add(insight.id);
      markAsRead({ id: insight.id });
    }

    setChatId(chatId);
    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: `Show me my ${insight.periodType} summary for ${insight.periodLabel}`,
        },
      ],
      metadata: {
        toolCall: {
          toolName: "getInsights",
          toolParams: {
            periodType: insight.periodType,
            periodNumber: insight.periodNumber,
            year: insight.periodYear,
          },
        },
      },
    });
  }, [insights, chatId, setChatId, sendMessage, markAsRead]);

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Weekly Insights"
        descriptionLines={3}
        showValue={false}
        className="dark:bg-[#131313] bg-[#f7f7f7] border-[#e6e6e6]"
      />
    );
  }

  if (insights.length === 0) {
    const hasAnyInsights = (allInsightsData?.data?.length ?? 0) > 0;

    return (
      <div
        className={cn(
          "dark:bg-[#131313] bg-[#f7f7f7] border dark:border-[#1d1d1d] border-[#e6e6e6] p-4 h-[210px]",
          "flex flex-col justify-between",
        )}
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[12px] dark:text-[#666666] text-[#707070] font-medium">
              Weekly Insights
            </h4>
          </div>
          {hasAnyInsights ? (
            // All insights have been dismissed
            <p className="text-[14px] leading-[19px] dark:text-[#666666] text-[#707070]">
              All caught up! New insights will appear here next Monday.
            </p>
          ) : (
            // No insights generated yet - explain what this feature does
            <p className="text-[14px] leading-[19px] dark:text-[#666666] text-[#707070]">
              Every Monday you'll receive a summary of the previous week's
              performance. Check back soon!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[210px] group cursor-pointer"
      onClick={handleCardClick}
    >
      <AnimatePresence mode="popLayout">
        {/* Render cards in reverse order so first card is on top */}
        {[...insights].reverse().map((insight, reverseIndex) => {
          const index = insights.length - 1 - reverseIndex;
          return (
            <InsightCard
              key={insight.id}
              insight={insight}
              index={index}
              totalCards={insights.length}
              onDismiss={handleDismiss}
              onListenClick={handleListenClick}
            />
          );
        })}
      </AnimatePresence>

      {/* Card counter dots */}
      {insights.length > 1 && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {insights.map((insight, idx) => (
            <div
              key={insight.id}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                idx === 0
                  ? "dark:bg-white bg-black"
                  : "dark:bg-[#333333] bg-[#cccccc]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
