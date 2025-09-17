import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/provider";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview({
  params,
}: {
  params: Promise<{ chatId?: string }>;
}) {
  const { chatId } = await params;

  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  if (!chatId) {
    redirect("/");
  }

  prefetch(trpc.chats.get.queryOptions({ chatId }));

  return (
    <HydrateClient>
      <ChatProvider id={chatId} geo={geo}>
        <ChatInterface />
      </ChatProvider>
    </HydrateClient>
  );
}
