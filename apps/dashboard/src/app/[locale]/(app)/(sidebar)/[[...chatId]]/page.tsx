import { ChatInterface } from "@/components/chat/chat-interface";
import { OverviewModal } from "@/components/modals/overview-modal";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview({
  params,
}: {
  params: Promise<{ chatId?: string[] }>;
}) {
  const { chatId } = await params;
  const cookieStore = await cookies();
  const hideConnectFlow =
    cookieStore.get(Cookies.HideConnectFlow)?.value === "true";

  // Extract the first chatId if it exists
  const currentChatId = chatId?.at(0);

  const queryClient = getQueryClient();

  // Prefetch chat data if chatId exists
  if (currentChatId) {
    prefetch(trpc.chats.get.queryOptions({ chatId: currentChatId }));
  }

  return (
    <HydrateClient>
      <ChatInterface chatId={currentChatId} />
      <OverviewModal hideConnectFlow={hideConnectFlow} />
    </HydrateClient>
  );
}
