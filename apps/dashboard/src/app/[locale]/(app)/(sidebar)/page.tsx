import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  const queryClient = getQueryClient();

  // Fetch widget preferences directly for initial data (no prefetch needed)
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

        {process.env.NODE_ENV === "development" && (
          <AIDevtools
            config={{
              streamCapture: {
                enabled: true,
                endpoint: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
                autoConnect: true,
              },
            }}
          />
        )}
      </ChatProvider>
    </HydrateClient>
  );
}
