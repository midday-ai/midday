"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";

/**
 * Derive period label from period type, year, and number
 */
function getInsightPeriodLabel(
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

/**
 * Hook that handles the `?insight=` query parameter from email links.
 * When an insight ID is present in the URL, it automatically opens
 * that insight in the chat interface.
 */
export function useInsightFromUrl() {
  const searchParams = useSearchParams();
  const insightId = searchParams.get("insight");

  const trpc = useTRPC();
  const chatId = useChatId();
  const { sendMessage } = useChatActions();
  const { setChatId } = useChatInterface();
  const hasTriggeredRef = useRef<string | null>(null);

  // Fetch the insight data if we have an ID
  const { data: insight } = useQuery({
    ...trpc.insights.byId.queryOptions({ id: insightId! }),
    enabled: !!insightId && hasTriggeredRef.current !== insightId,
  });

  useEffect(() => {
    // Only trigger once per insight ID
    if (!insightId || !insight || !chatId) return;
    if (hasTriggeredRef.current === insightId) return;

    hasTriggeredRef.current = insightId;

    // Open the insight in the chat interface
    setChatId(chatId);
    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: `Show me my ${insight.periodType} summary for ${getInsightPeriodLabel(insight.periodType, insight.periodYear, insight.periodNumber)}`,
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

    // Clean up the URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete("insight");
    window.history.replaceState({}, "", url.toString());
  }, [insightId, insight, chatId, setChatId, sendMessage]);
}
