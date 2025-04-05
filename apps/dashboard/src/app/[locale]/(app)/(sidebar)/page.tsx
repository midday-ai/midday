import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { EmptyState } from "@/components/charts/empty-state";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { loadMetricsParams } from "@/hooks/use-metrics-params";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { cn } from "@midday/ui/cn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;

  const { from, to } = loadMetricsParams(searchParams);
  // const accounts = await getTeamBankAccounts();

  // Preload the data for the charts
  await Promise.allSettled([
    queryClient.fetchQuery(
      trpc.metrics.expense.queryOptions({
        from,
        to,
      }),
    ),
    queryClient.fetchQuery(
      trpc.metrics.profit.queryOptions({
        from,
        to,
      }),
    ),
    queryClient.fetchQuery(
      trpc.metrics.revenue.queryOptions({
        from,
        to,
      }),
    ),
    queryClient.fetchQuery(
      trpc.metrics.burnRate.queryOptions({
        from,
        to,
      }),
    ),
    queryClient.fetchQuery(
      trpc.metrics.runway.queryOptions({
        from,
        to,
      }),
    ),
  ]);

  // const isEmpty = !accounts?.data?.length;
  const isEmpty = false;

  return (
    <HydrateClient>
      <div>
        <div className="h-[530px] mb-4">
          <ChartSelectors />

          <div className="mt-8 relative">
            {isEmpty && <EmptyState />}

            <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
              <Charts disabled={isEmpty} />
            </div>
          </div>
        </div>

        {/* <Widgets
          initialPeriod={initialPeriod}
          disabled={isEmpty}
          searchParams={searchParams}
        /> */}
      </div>

      {/* <OverviewModal defaultOpen={isEmpty && !hideConnectFlow} /> */}
    </HydrateClient>
  );
}
