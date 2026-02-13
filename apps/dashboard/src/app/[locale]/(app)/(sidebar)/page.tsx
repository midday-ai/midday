import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { geolocation } from "@/utils/geo";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const headersList = await headers();
  const geo = geolocation(headersList);

  // Non-blocking prefetches — data is in-flight before components render
  prefetch(trpc.widgets.getWidgetPreferences.queryOptions());
  prefetch(trpc.suggestedActions.list.queryOptions({ limit: 6 }));

  return (
    <HydrateClient>
      <ChatProvider initialMessages={[]} key="home">
        <Widgets />

        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
