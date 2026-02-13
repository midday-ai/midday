import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";
import { geolocation } from "@/utils/geo";

export const metadata: Metadata = {
  title: "Chat | Midday",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage(props: Props) {
  const { id } = await props.params;

  const headersList = await headers();
  const geo = geolocation(headersList);

  const queryClient = getQueryClient();

  // Fetch widget preferences so the dashboard renders with data immediately
  const widgetPreferences = await queryClient.fetchQuery(
    trpc.widgets.getWidgetPreferences.queryOptions(),
  );

  prefetch(trpc.suggestedActions.list.queryOptions({ limit: 6 }));

  const chat = await queryClient.fetchQuery(
    trpc.chats.get.queryOptions({ chatId: id }),
  );

  if (!chat) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <ChatProvider initialMessages={chat} key={id}>
        <Widgets initialPreferences={widgetPreferences} />

        <ChatInterface geo={geo} />
      </ChatProvider>
    </HydrateClient>
  );
}
