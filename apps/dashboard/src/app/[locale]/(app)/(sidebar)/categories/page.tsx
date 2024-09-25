import { CategoryCharts } from "@/components/charts/categories-chart";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import Tier from "@/config/tier";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function InboxPage({ searchParams }: Props) {
  const user = await getUser();
  const accounts = await getTeamBankAccounts();
  const isEmpty = !accounts?.data?.length;
  const tier: Tier = user?.data?.tier ?? "free";

  return (
    <Suspense fallback={<InboxViewSkeleton ascending />}>
      <ConnectAccountServerWrapper>
        <CategoryCharts
          currency={(searchParams.currency as string) ?? "USD"}
          disableAllCharts={isEmpty}
          tier={tier}
        />
      </ConnectAccountServerWrapper>
    </Suspense>
  );
}
