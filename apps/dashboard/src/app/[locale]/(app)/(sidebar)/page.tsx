import { ChatInput } from "@/components/chat/chat-input";
import { ChatProvider } from "@/components/chat/provider";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { HydrateClient } from "@/trpc/server";
import { Cookies } from "@/utils/constants";
import { geolocation } from "@vercel/functions";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const cookieStore = await cookies();
  const hideConnectFlow =
    cookieStore.get(Cookies.HideConnectFlow)?.value === "true";

  const headersList = await headers();
  const geo = geolocation({
    headers: headersList,
  });

  return (
    <HydrateClient>
      <Widgets />
      <ChatProvider geo={geo}>
        <ChatInput />
      </ChatProvider>
      <OverviewModal hideConnectFlow={hideConnectFlow} />
    </HydrateClient>
  );
}
