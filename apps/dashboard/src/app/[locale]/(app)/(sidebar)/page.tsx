import { Chat } from "@/components/chat";
import { OverviewModal } from "@/components/modals/overview-modal";
import { loadReportsParams } from "@/hooks/use-reports-params";
import { HydrateClient } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Overview(props: Props) {
  const searchParams = await props.searchParams;

  const cookieStore = await cookies();
  const hideConnectFlow =
    cookieStore.get(Cookies.HideConnectFlow)?.value === "true";

  return (
    <HydrateClient>
      <div>
        <Chat />
      </div>

      <OverviewModal hideConnectFlow={hideConnectFlow} />
    </HydrateClient>
  );
}
