import { CashflowCharts } from "@/components/charts/cashflow-charts";
import { EmptyState } from "@/components/charts/empty-state";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Cookies } from "@/utils/constants";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Cash Flow | Midday",
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

export default async function CashFlowPage({ searchParams }: Props) {
    const user = await getUser();
    const accounts = await getTeamBankAccounts();
    const isEmpty = !accounts?.data?.length;

    return (
        <Suspense fallback={<InboxViewSkeleton ascending />}>
            <ConnectAccountServerWrapper>
                <div className="mt-8">
                    <div className={cn(isEmpty && "relative")}>
                        {isEmpty && <EmptyState />}
                        <div className={cn("py-[2%]", isEmpty && "blur-[8px] opacity-20")}>
                            <ConnectedAccountSummary
                                name={user?.data?.full_name ?? "Solomon AI User"}
                            />
                        </div>
                    </div>
                    <div className={cn("mt-4", isEmpty && "relative")}>
                        {isEmpty && <EmptyState />}
                        <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
                            <CashflowCharts
                                currency={(searchParams.currency as string) ?? "USD"}
                                disableAllCharts={true}
                            />
                        </div>
                    </div>
                </div>
            </ConnectAccountServerWrapper>
        </Suspense>
    );
}
