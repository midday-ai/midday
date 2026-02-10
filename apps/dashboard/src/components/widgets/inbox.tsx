import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WidgetSkeleton } from "./widget-skeleton";

export function InboxWidget() {
  const trpc = useTRPC();
  const _router = useRouter();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getInboxStats.queryOptions({
      from: startOfDay(subDays(new Date(), 7)).toISOString(),
      to: endOfDay(new Date()).toISOString(),
      currency,
    }),
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Inbox"
        icon={<Icons.Inbox2 className="size-4" />}
        descriptionLines={2}
        showValue={false}
      />
    );
  }

  const stats = data?.result;

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, any>;
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

  const handleViewInbox = () => {
    handleToolCall({
      toolName: "getInbox",
      toolParams: {
        pageSize: 20,
      },
      text: "Show inbox items",
    });
  };

  // Calculate key metrics for display
  const newItemsText = stats?.newItems === 1 ? "new item" : "new items";
  const suggestionsText =
    stats?.suggestedMatches === 1 ? "suggested match" : "suggested matches";
  const recentMatchesText = stats?.recentMatches === 1 ? "match" : "matches";

  const getStatusText = () => {
    const keyParts: string[] = [];

    // Focus on the three key metrics: matches, suggestions, and new items
    if (stats?.recentMatches) {
      keyParts.push(`${stats.recentMatches} ${recentMatchesText} this week`);
    }

    if (stats?.suggestedMatches) {
      keyParts.push(`${stats.suggestedMatches} ${suggestionsText}`);
    }

    if (stats?.newItems) {
      keyParts.push(`${stats.newItems} ${newItemsText}`);
    }

    // Show the key metrics prominently
    if (keyParts.length > 0) {
      if (keyParts.length === 1) {
        return `You have ${keyParts[0]}.`;
      }
      if (keyParts.length === 2) {
        return `You have ${keyParts[0]} and ${keyParts[1]}.`;
      }
      // For all three metrics, show progress first, then actionable items
      return `You have ${keyParts[0]}, ${keyParts[1]}, and ${keyParts[2]}.`;
    }

    // Fallback to other statuses only if no key metrics
    const otherItems =
      (stats?.pendingItems || 0) + (stats?.analyzingItems || 0);

    if (otherItems > 0) {
      const itemText = otherItems === 1 ? "item" : "items";
      return `You have ${otherItems} ${itemText} being processed.`;
    }

    return "Your inbox is all caught up!";
  };

  return (
    <BaseWidget
      title="Inbox"
      icon={<Icons.Inbox2 className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">{getStatusText()}</p>
        </div>
      }
      actions="View inbox"
      onClick={handleViewInbox}
    />
  );
}
