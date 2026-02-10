"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useAudioPlayerStore } from "@/store/audio-player";
import { useTRPC } from "@/trpc/client";
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
  story?: string;
  hasAudio?: boolean;
};

// Drag threshold to trigger card cycle
const DRAG_THRESHOLD = 50;

interface InsightCardComponentProps {
  insight: InsightCard;
  index: number;
  totalCards: number;
  isNew?: boolean;
  onListenClick: (insight: InsightCard) => void;
  onCardClick: (insight: InsightCard) => void;
  onDismissClick: (insight: InsightCard) => void;
  onDragStart?: () => void;
  onDragEnd?: (cycleDirection: "left" | "right" | null) => void;
}

function InsightCardComponent({
  insight,
  index,
  totalCards,
  isNew,
  onListenClick,
  onCardClick,
  onDismissClick,
  onDragStart,
  onDragEnd,
}: InsightCardComponentProps) {
  const isDraggingRef = useRef(false);
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
      initial={
        isNew
          ? {
              opacity: 0,
              scale: 0.8,
              y: -80,
              rotateX: 25,
            }
          : false
      }
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotateX: 0,
      }}
      exit={{
        x: -300,
        opacity: 0,
        rotate: -20,
        transition: {
          duration: 0.2,
          ease: [0.32, 0, 0.67, 0],
        },
      }}
      transition={
        isNew
          ? {
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8,
              delay: 0.1,
            }
          : {
              type: "spring",
              stiffness: 800,
              damping: 40,
              mass: 0.6,
            }
      }
      className="absolute inset-0 h-[210px]"
      style={{
        zIndex: totalCards - index,
        x: isTopCard ? x : 0,
        rotate: isTopCard ? dragRotate : 0,
        perspective: 1000,
      }}
      drag={isTopCard && totalCards > 1 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragStart={() => {
        isDraggingRef.current = true;
        onDragStart?.();
      }}
      onDragEnd={(_, info) => {
        // Delay clearing drag flag to prevent click from firing
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);

        if (isTopCard && onDragEnd) {
          if (Math.abs(info.offset.x) > DRAG_THRESHOLD) {
            onDragEnd(info.offset.x > 0 ? "right" : "left");
          } else {
            onDragEnd(null);
          }
        }
      }}
      whileDrag={{ cursor: "grabbing" }}
      onClick={(e) => {
        // Don't trigger card click if dragging or clicking a button
        if (isDraggingRef.current) return;
        if ((e.target as HTMLElement).closest("button")) return;
        if (isTopCard) {
          onCardClick(insight);
        }
      }}
    >
      <div
        style={
          index > 1
            ? {
                transform: `rotate(${baseRotation}deg) translateX(${translateX}px) translateY(${translateY}px)`,
                opacity,
                pointerEvents: "none",
              }
            : {
                opacity,
                pointerEvents: isTopCard ? "auto" : "none",
              }
        }
        className={cn(
          "absolute inset-0 h-[210px] p-4 flex flex-col justify-between",
          "dark:bg-[#131313] bg-[#f7f7f7]",
          "dark:border-[#1d1d1d] border-[#e6e6e6] border",
          "dark:shadow-[0_6px_16px_rgba(0,0,0,0.3)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]",
          isTopCard && totalCards > 1 && "cursor-grab",
          // Top card (index 0): tilts left, more on hover
          isTopCard &&
            "-rotate-[1.5deg] translate-x-[2px] -translate-y-[1px] transition-transform duration-300 group-hover:-rotate-[2.5deg]",
          // Second card (index 1): tilts right, more on hover
          index === 1 &&
            "rotate-[1deg] translate-y-[4px] transition-transform duration-300 group-hover:rotate-[2deg]",
        )}
      >
        {isTopCard && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-[12px] dark:text-[#666666] text-[#707070] font-medium">
                  {insight.periodLabel}
                </h4>
              </div>
              <p className="text-[14px] leading-[19px] dark:text-white text-black mb-8 line-clamp-4">
                {insight.title}
              </p>
            </div>
            <div className="flex items-end justify-between text-[12px] text-nowrap">
              {insight.hasAudio ? (
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
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissClick(insight);
                }}
                className={cn(
                  "flex items-center gap-1",
                  "dark:text-[rgba(102,102,102,0.5)] text-[rgba(112,112,112,0.5)]",
                  "transition-colors",
                  "dark:hover:text-white hover:text-black cursor-pointer",
                )}
              >
                Dismiss
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
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const showLoading = useAudioPlayerStore((state) => state.showLoading);
  const setAudioUrl = useAudioPlayerStore((state) => state.setUrl);

  // Refs for managing state without re-renders
  const audioFetchingRef = useRef(false);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const knownInsightIdsRef = useRef<Set<string>>(new Set());
  const [newInsightIds, setNewInsightIds] = useState<Set<string>>(new Set());

  // Fetch insights (excluding dismissed)
  const { data, isLoading } = useQuery(
    trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 10,
      includeDismissed: false,
    }),
  );

  // Mutation to mark insight as read
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

  // Transform API data to card format
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
      story: insight.content?.story,
      // Audio is generated lazily - show button if content exists (audio can be generated)
      hasAudio: !!insight.content,
    })) ?? [];

  // Track card order for drag cycling
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  // Sync card order with data and track new insights on initial load
  useEffect(() => {
    const currentIds = insightsData.map((i) => i.id);

    // On initial load, mark all as known (no animation for existing insights)
    if (knownInsightIdsRef.current.size === 0 && currentIds.length > 0) {
      knownInsightIdsRef.current = new Set(currentIds);
    }

    // Update card order if needed
    if (
      currentIds.length !== cardOrder.length ||
      !currentIds.every((id) => cardOrder.includes(id))
    ) {
      // Put new insights at the front
      const newIds = currentIds.filter(
        (id) => !knownInsightIdsRef.current.has(id),
      );
      const existingIds = currentIds.filter((id) =>
        knownInsightIdsRef.current.has(id),
      );

      // Add new IDs to known set and trigger animation
      if (newIds.length > 0) {
        for (const id of newIds) {
          knownInsightIdsRef.current.add(id);
        }
        // Mark new insights for animation
        setNewInsightIds(new Set(newIds));
        // Clear the "new" status after animation completes
        setTimeout(() => {
          setNewInsightIds(new Set());
        }, 2500);
      }

      setCardOrder([...newIds, ...existingIds]);
    }
  }, [insightsData, cardOrder]);

  // Reorder insights based on cardOrder
  const insights = cardOrder
    .map((id) => insightsData.find((i) => i.id === id))
    .filter((i): i is InsightCard => i !== undefined);

  const handleDragEnd = useCallback(
    (cycleDirection: "left" | "right" | null) => {
      if (cycleDirection) {
        setCardOrder((prev) => {
          if (prev.length <= 1) return prev;
          const first = prev[0] as string;
          const last = prev[prev.length - 1] as string;
          if (cycleDirection === "left") {
            return [...prev.slice(1), first];
          }
          return [last, ...prev.slice(0, -1)];
        });
      }
    },
    [],
  );

  const handleListenClick = useCallback(
    async (insight: InsightCard) => {
      if (!insight.hasAudio) return;

      // Prevent concurrent fetches - if already fetching, ignore this click
      if (audioFetchingRef.current) return;

      audioFetchingRef.current = true;

      // Show the audio player immediately with loading state
      showLoading();

      try {
        const result = await queryClient.fetchQuery(
          trpc.insights.audioUrl.queryOptions({ id: insight.id }),
        );

        if (result.audioUrl) {
          // Set the URL and auto-play
          setAudioUrl(result.audioUrl);
        }
      } catch (error) {
        console.error("Failed to fetch audio URL:", error);
        // Close the player on error
        useAudioPlayerStore.getState().close();
      } finally {
        audioFetchingRef.current = false;
      }
    },
    [queryClient, trpc, showLoading, setAudioUrl],
  );

  const handleCardClick = useCallback(
    (insight: InsightCard) => {
      if (!chatId) return;

      // Mark as read
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
    [chatId, setChatId, sendMessage, markAsRead],
  );

  const handleDismissClick = useCallback(
    (insight: InsightCard) => {
      // Remove from local card order immediately for smooth animation
      setCardOrder((prev) => prev.filter((id) => id !== insight.id));
      // Dismiss on server
      dismissInsight({ id: insight.id });
    },
    [dismissInsight],
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

  if (insightsData.length === 0) {
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
            No new insights available. Every Monday you'll receive a summary of
            the previous week's performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[210px] group cursor-pointer">
      <AnimatePresence mode="sync" initial={false}>
        {[...insights].reverse().map((insight, reverseIndex) => {
          const index = insights.length - 1 - reverseIndex;
          return (
            <InsightCardComponent
              key={insight.id}
              insight={insight}
              index={index}
              totalCards={insights.length}
              isNew={newInsightIds.has(insight.id)}
              onListenClick={handleListenClick}
              onCardClick={handleCardClick}
              onDismissClick={handleDismissClick}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
