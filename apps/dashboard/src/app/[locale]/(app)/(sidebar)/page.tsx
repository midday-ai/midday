import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";
import { geolocation } from "@/utils/geo";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const headersList = await headers();
  const geo = geolocation(headersList);

  const queryClient = getQueryClient();

  // Fetch widget preferences so the dashboard renders with data immediately
  const widgetPreferences = await queryClient.fetchQuery(
    trpc.widgets.getWidgetPreferences.queryOptions(),
  );

  // Prefetch suggested actions (metrics are prefetched client-side to respect localStorage)
  prefetch(trpc.suggestedActions.list.queryOptions({ limit: 6 }));

  return (
    <HydrateClient>
      <ChatProvider initialMessages={[]} key="home">
        <Widgets initialPreferences={widgetPreferences} />

        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
