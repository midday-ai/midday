import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import {
  batchPrefetch,
  getQueryClient,
  HydrateClient,
  trpc,
} from "@/trpc/server";
import { geolocation } from "@/utils/geo";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const headersList = await headers();
  const geo = geolocation(headersList);

  const queryClient = getQueryClient();

  // Prefetch suggested actions (metrics are prefetched client-side to respect localStorage)
  batchPrefetch([
    trpc.widgets.getWidgetPreferences.queryOptions(),
    trpc.suggestedActions.list.queryOptions({ limit: 6 }),
  ]);

  // Fetch widget preferences so the dashboard renders with data immediately.
  // On failure, fall back to empty preferences – the Widgets component will
  // still mount and the client-side useQuery will refetch automatically.
  const widgetPreferences = await queryClient
    .fetchQuery(trpc.widgets.getWidgetPreferences.queryOptions())
    .catch(() => ({
      primaryWidgets: [] as string[],
      availableWidgets: [] as string[],
    }));

  return (
    <HydrateClient>
      <ChatProvider initialMessages={[]} key="home">
        <Widgets initialPreferences={widgetPreferences} />

        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
