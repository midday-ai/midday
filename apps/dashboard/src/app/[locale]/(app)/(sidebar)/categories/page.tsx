import { CategoryCharts } from "@/components/charts/categories-chart";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Categories | Midday",
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

export default function InboxPage({ searchParams }: Props) {
    return (
        <Suspense fallback={<InboxViewSkeleton ascending />}>
            <ConnectAccountServerWrapper>
                <CategoryCharts currency={searchParams.currency as string ?? "USD"} disableAllCharts={true} />
            </ConnectAccountServerWrapper>
        </Suspense>
    );
}
