import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";

export function InboxWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const router = useRouter();

  const { data } = useQuery(
    trpc.widgets.getInboxStats.queryOptions({
      from: startOfDay(subDays(new Date(), 7)).toISOString(),
      to: endOfDay(new Date()).toISOString(),
      currency: team?.baseCurrency ?? undefined,
    }),
  );

  const stats = data?.result;

  const handleViewInbox = () => {
    router.push("/inbox");
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
