import { ChatInterface } from "@/components/chat/chat-interface";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const cookieStore = await cookies();
  const hideConnectFlow =
    cookieStore.get(Cookies.HideConnectFlow)?.value === "true";

  return (
    <>
      <ChatInterface />

      <OverviewModal hideConnectFlow={hideConnectFlow} />
    </>
  );
}
