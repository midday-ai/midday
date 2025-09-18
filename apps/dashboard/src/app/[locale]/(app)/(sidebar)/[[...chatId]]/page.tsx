import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/provider";
import { Widgets } from "@/components/widgets";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
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

  const chat = currentChatId
    ? await queryClient.fetchQuery(
        trpc.chats.get.queryOptions({ chatId: currentChatId }),
      )
    : null;

  if (currentChatId && !chat?.messages) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <Widgets />
      <ChatProvider id={currentChatId} geo={geo} messages={chat?.messages}>
        <ChatInterface />
      </ChatProvider>
    </HydrateClient>
  );
}
