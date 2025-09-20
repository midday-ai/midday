import { ChatInterface } from "@/components/chat/chat-interface";
import { Widgets } from "@/components/widgets";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
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
      <ChatProvider initialMessages={chat?.messages}>
        <Widgets />

        <ChatInterface geo={geo} id={currentChatId} />
      </ChatProvider>
    </HydrateClient>
  );
}
