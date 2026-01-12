"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useLongPress } from "@/hooks/use-long-press";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useCallback, useRef, useState } from "react";
import { useIsCustomizing, useWidgetActions } from "./widget-provider";

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
  opener?: string;
  story?: string;
  generatedAt: string | null;
  hasAudio?: boolean;
};

function SortableInsightCard({
  insight,
  index,
  totalCards,
  isTopCard,
  isCustomizing,
  onDismiss,
  onListenClick,
}: {
  insight: InsightCard;
  index: number;
  totalCards: number;
  isTopCard: boolean;
  isCustomizing: boolean;
  onDismiss: (id: string) => void;
  onListenClick: (insight: InsightCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: insight.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : totalCards - index,
  };

  // Calculate rotation and offset based on position in stack
  const baseRotation = isTopCard ? -1.5 : index * 0.5;
  const translateY = isTopCard ? -1 : index * 4;
  const translateX = isTopCard ? 2 : 0;
  const opacity = isTopCard ? 1 : 1 - index * 0.2;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("absolute inset-0 h-[210px]", isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "absolute inset-0 h-[210px] p-4 flex flex-col justify-between",
          "dark:bg-[#131313] bg-[#f7f7f7]",
          "dark:border-[#1d1d1d] border-[#e6e6e6] border",
          "dark:shadow-[0_6px_16px_rgba(0,0,0,0.3)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]",
          "transition-all duration-300",
          isTopCard && !isCustomizing && "group-hover:-rotate-[2.5deg]",
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
                {insight.opener || insight.story}{" "}
                {totalCards > 1 && (
                  <span className="dark:text-[#666666] text-[#707070]">
                    Drag to see more →
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-end justify-between text-[12px] text-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCustomizing) {
                    onDismiss(insight.id);
                  }
                }}
                className={cn(
                  "dark:text-[#666666] text-[#707070] transition-colors order-2",
                  !isCustomizing && "dark:hover:text-white hover:text-black",
                )}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCustomizing) {
                    onListenClick(insight);
                  }
                }}
                className={cn(
                  "flex items-center gap-1",
                  "dark:text-[rgba(102,102,102,0.5)] text-[rgba(112,112,112,0.5)]",
                  "transition-colors order-1",
                  !isCustomizing &&
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
    </div>
  );
}

function InsightCardOverlay({ insight }: { insight: InsightCard }) {
  return (
    <div
      className={cn(
        "h-[210px] p-4 flex flex-col justify-between",
        "dark:bg-[#131313] bg-[#f7f7f7]",
        "dark:border-[#1d1d1d] border-[#e6e6e6] border",
        "dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] shadow-[0px_8px_16px_0px_rgba(0,0,0,0.15)]",
        "rotate-[-3deg] scale-105",
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] dark:text-[#666666] text-[#707070] font-medium">
            {insight.periodLabel}
          </h4>
        </div>
        <p className="text-[14px] leading-[19px] dark:text-white text-black line-clamp-4">
          {insight.opener || insight.story}
        </p>
      </div>
    </div>
  );
}

export function InsightsWidget() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const isCustomizing = useIsCustomizing();
  const { setIsCustomizing } = useWidgetActions();
  const containerRef = useRef<HTMLDivElement>(null);

  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: isCustomizing,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  );

  // Fetch insights list
  const { data, isLoading } = useQuery(
    trpc.insights.list.queryOptions({
      periodType: "weekly",
      limit: 5,
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

  const allInsights: InsightCard[] =
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
      opener: insight.content?.opener,
      story: insight.content?.story,
      generatedAt: insight.generatedAt?.toISOString() ?? null,
      hasAudio: !!insight.audioPath,
    })) ?? [];

  // Initialize card order when data loads
  if (cardOrder.length === 0 && allInsights.length > 0) {
    setCardOrder(allInsights.map((i) => i.id));
  }

  // Keep card order in sync with data (remove dismissed from order)
  const orderedInsights = cardOrder
    .map((id) => allInsights.find((i) => i.id === id))
    .filter((i): i is InsightCard => i !== undefined);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = cardOrder.indexOf(active.id as string);
      const newIndex = cardOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        setCardOrder(arrayMove(cardOrder, oldIndex, newIndex));
      }
    },
    [cardOrder],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      // Optimistically remove from card order
      setCardOrder((prev) => prev.filter((cardId) => cardId !== id));
      // Call API to persist the dismiss
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
        setAudioPlaying(null);
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
          setAudioPlaying(insight.id);

          audio.onended = () => {
            setAudioPlaying(null);
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
    const insight = orderedInsights[0];
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
  }, [orderedInsights, chatId, setChatId, sendMessage, markAsRead]);

  const activeInsight = activeId
    ? orderedInsights.find((i) => i.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "dark:bg-[#0c0c0c] bg-white border dark:border-[#1d1d1d] border-[#e6e6e6] p-4 h-[210px]",
          "flex items-center justify-center",
        )}
      >
        <div className="text-sm dark:text-[#666666] text-[#707070]">
          Loading insights...
        </div>
      </div>
    );
  }

  if (orderedInsights.length === 0) {
    return (
      <div
        className={cn(
          "dark:bg-[#131313] bg-[#f7f7f7] border dark:border-[#1d1d1d] border-[#e6e6e6] p-4 h-[210px]",
          "flex flex-col justify-between",
        )}
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icons.AI className="size-4 dark:text-[#666666] text-[#707070]" />
            <h4 className="text-[12px] dark:text-[#666666] text-[#707070] font-medium">
              Weekly Insights
            </h4>
          </div>
          <p className="text-[14px] leading-[19px] dark:text-[#666666] text-[#707070]">
            Your weekly insights will appear here once generated. Check back
            Monday!
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative h-[210px] group",
          !isCustomizing && "cursor-pointer",
        )}
        onClick={!activeId ? handleCardClick : undefined}
        {...longPressHandlers}
      >
        <SortableContext
          items={orderedInsights.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Render cards in reverse order so first card is on top */}
          {[...orderedInsights].reverse().map((insight, reverseIndex) => {
            const index = orderedInsights.length - 1 - reverseIndex;
            return (
              <SortableInsightCard
                key={insight.id}
                insight={insight}
                index={index}
                totalCards={orderedInsights.length}
                isTopCard={index === 0}
                isCustomizing={isCustomizing}
                onDismiss={handleDismiss}
                onListenClick={handleListenClick}
              />
            );
          })}
        </SortableContext>

        {/* Card counter dots */}
        {orderedInsights.length > 1 && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {orderedInsights.map((insight, idx) => (
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

      <DragOverlay>
        {activeInsight ? <InsightCardOverlay insight={activeInsight} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
