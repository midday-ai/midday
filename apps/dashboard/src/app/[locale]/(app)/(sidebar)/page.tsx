import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/provider";
import { Widgets } from "@/components/widgets";
import { loadChatParams } from "@/hooks/use-chat-params";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Overview(props: Props) {
  const searchParams = await props.searchParams;
  const { chatId: currentChatId } = loadChatParams(searchParams);

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
      <ChatProvider id={currentChatId} geo={geo}>
        <ChatInterface />
      </ChatProvider>
    </HydrateClient>
  );
}
