import { CashflowCharts } from "@/components/charts/cashflow-charts";
import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { Cookies } from "@/utils/constants";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Cash Flow | Midday",
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

export default async function InboxPage({ searchParams }: Props) {

    return (
        <Suspense
            fallback={<InboxViewSkeleton ascending />}
        >
            <CashflowCharts currency={searchParams.currency as string ?? "USD"} disableAllCharts={true} />
        </Suspense>
    );
}
