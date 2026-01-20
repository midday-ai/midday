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
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Drag threshold to trigger card cycle
const DRAG_THRESHOLD = 50;

function InsightCardComponent({
  insight,
  index,
  totalCards,
  onListenClick,
  onDragStart,
  onDragEnd,
}: {
  insight: InsightCard;
  index: number;
  totalCards: number;
  onListenClick: (insight: InsightCard) => void;
  onDragStart?: () => void;
  onDragEnd?: (cycleDirection: "left" | "right" | null) => void;
}) {
  const isTopCard = index === 0;

  // Motion values for interactive drag
  const x = useMotionValue(0);

  // Transform drag position to rotation (tilt while dragging)
  const dragRotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);

  // Calculate rotation and offset based on position in stack
  const baseRotation = isTopCard ? -1.5 : index * 0.5;
  const translateY = isTopCard ? -1 : index * 4;
  const translateX = isTopCard ? 2 : 0;
  const opacity = isTopCard ? 1 : 1 - index * 0.2;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      exit={{
        x: -300,
        opacity: 0,
        rotate: -20,
        transition: {
          duration: 0.4,
          ease: [0.32, 0, 0.67, 0],
        },
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 35,
        mass: 1,
      }}
      className="absolute inset-0 h-[210px]"
      style={{
        zIndex: totalCards - index,
        x: isTopCard ? x : 0,
        rotate: isTopCard ? dragRotate : 0,
      }}
      drag={isTopCard && totalCards > 1 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragStart={isTopCard ? onDragStart : undefined}
      onDragEnd={
        isTopCard && onDragEnd
          ? (_, info) => {
              if (Math.abs(info.offset.x) > DRAG_THRESHOLD) {
                onDragEnd(info.offset.x > 0 ? "right" : "left");
              } else {
                onDragEnd(null);
              }
            }
          : undefined
      }
      whileDrag={{ cursor: "grabbing" }}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: baseRotation,
          x: translateX,
          y: translateY,
          opacity,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className={cn(
          "absolute inset-0 h-[210px] p-4 flex flex-col justify-between",
          "dark:bg-[#131313] bg-[#f7f7f7]",
          "dark:border-[#1d1d1d] border-[#e6e6e6] border",
          "dark:shadow-[0_6px_16px_rgba(0,0,0,0.3)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]",
          isTopCard && totalCards > 1 && "cursor-grab",
        )}
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
            <div className="flex items-end text-[12px] text-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onListenClick(insight);
                }}
                className={cn(
                  "flex items-center gap-1",
                  "dark:text-[rgba(102,102,102,0.5)] text-[rgba(112,112,112,0.5)]",
                  "transition-colors",
                  "dark:hover:text-white hover:text-black cursor-pointer",
                )}
              >
                <Icons.UnMute className="size-3" />
                Listen to breakdown
              </button>
            </div>
          </>
        )}
      </motion.div>
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
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Cleanup audio on unmount to prevent audio playing after navigation
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch all insights (including dismissed) - latest first
  const { data, isLoading } = useQuery(
    trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 10,
      includeDismissed: true,
    }),
  );

  // Mutation to mark insight as read (fire and forget)
  const { mutate: markAsRead } = useMutation(
    trpc.insights.markAsRead.mutationOptions(),
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

  const insightsData: InsightCard[] =
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

  // Track the order of cards for drag cycling
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  // Update card order when insights data changes
  useEffect(() => {
    const newIds = insightsData.map((i) => i.id);
    // Only reset if the underlying data changed (new/removed insights)
    if (
      newIds.length !== cardOrder.length ||
      !newIds.every((id) => cardOrder.includes(id))
    ) {
      setCardOrder(newIds);
    }
  }, [insightsData, cardOrder]);

  // Reorder insights based on cardOrder
  const insights = cardOrder
    .map((id) => insightsData.find((i) => i.id === id))
    .filter((i): i is InsightCard => i !== undefined);

  // Mark as dragging immediately when drag starts
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle drag end - cycles cards if threshold passed
  const handleDragEnd = useCallback(
    (cycleDirection: "left" | "right" | null) => {
      // Keep dragging flag true for a bit longer to block the click event
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 300);

      // Only cycle if a direction was provided (threshold was passed)
      if (cycleDirection) {
        setCardOrder((prev) => {
          if (prev.length <= 1) return prev;
          const first = prev[0] as string;
          const last = prev[prev.length - 1] as string;
          if (cycleDirection === "left") {
            // Move first card to end
            return [...prev.slice(1), first];
          }
          // Move last card to front
          return [last, ...prev.slice(0, -1)];
        });
      }
    },
    [],
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

          audio.onerror = () => {
            audioRef.current = null;
          };

          await audio.play();
        }
      } catch (error) {
        audioRef.current = null;
      }
    },
    [chatId, setChatId, sendMessage, queryClient, trpc],
  );

  // Track pointer start position to detect movement
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Check if pointer moved more than 5px (indicates drag, not click)
      if (pointerStartRef.current) {
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        if (dx > 5 || dy > 5) {
          pointerStartRef.current = null;
          return;
        }
      }
      pointerStartRef.current = null;

      // Also check the dragging ref as backup
      if (isDraggingRef.current) return;

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
    },
    [insights, chatId, setChatId, sendMessage, markAsRead],
  );

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
          <p className="text-[14px] leading-[19px] dark:text-[#666666] text-[#707070]">
            Every Monday you'll receive a summary of the previous week's
            performance. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[210px] group cursor-pointer"
      onPointerDown={handlePointerDown}
      onClick={handleCardClick}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {/* Render cards in reverse order so first card is on top */}
        {[...insights].reverse().map((insight, reverseIndex) => {
          const index = insights.length - 1 - reverseIndex;
          return (
            <InsightCardComponent
              key={insight.id}
              insight={insight}
              index={index}
              totalCards={insights.length}
              onListenClick={handleListenClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
