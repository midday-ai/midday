import { CategoryCharts } from "@/components/charts/categories-chart";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Categories | Midday",
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

export default async function InboxPage({ searchParams }: Props) {

    return (
        <Suspense
            fallback={<InboxViewSkeleton ascending />}
        >
            <CategoryCharts currency={searchParams.currency as string ?? "USD"} disableAllCharts={true} />
        </Suspense>
    );
}
