import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  try {
    await prefetch(trpc.jobs.analytics.queryOptions({ hours: 24 }));
  } catch (error) {
    console.error("[AnalyticsPage] Error prefetching data:", error);
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6 pt-6">
        <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
          Performance Analytics
        </h1>
        <Suspense
          fallback={
            <div className="text-muted-foreground">Loading analytics...</div>
          }
        >
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
