import { ChatInterface } from "@/components/chat/chat-interface";
import { OverviewModal } from "@/components/modals/overview-modal";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { Cookies } from "@/utils/constants";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

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

  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  // Extract the first chatId if it exists
  const currentChatId = chatId?.at(0);

  const queryClient = getQueryClient();

  try {
    const chat = currentChatId
      ? await queryClient.fetchQuery(
          trpc.chats.get.queryOptions({ chatId: currentChatId }),
        )
      : null;

    return (
      <HydrateClient>
        <ChatInterface
          id={currentChatId}
          initialMessages={chat?.messages as any}
          initialTitle={chat?.title}
          geo={geo}
        />
        <OverviewModal hideConnectFlow={hideConnectFlow} />
      </HydrateClient>
    );
    // We end up here if the chatId is not found or something else goes wrong
  } catch {
    redirect("/");
  }
}
