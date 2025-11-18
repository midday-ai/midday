import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

type Props = {
  params: Promise<{ chatId?: string[] }>;
};

export default async function Overview(props: Props) {
  const { chatId } = await props.params;

  // Extract the first chatId if it exists
  const currentChatId = chatId?.at(0);

  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  const queryClient = getQueryClient();

  // Fetch widget preferences directly for initial data (no prefetch needed)
  const widgetPreferences = await queryClient.fetchQuery(
    trpc.widgets.getWidgetPreferences.queryOptions(),
  );

  prefetch(trpc.suggestedActions.list.queryOptions({ limit: 6 }));

  const chat = currentChatId
    ? await queryClient.fetchQuery(
        trpc.chats.get.queryOptions({ chatId: currentChatId }),
      )
    : null;

  if (currentChatId && !chat) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <ChatProvider initialMessages={chat ?? []} key={currentChatId || "home"}>
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
