import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { EmptyState } from "@/components/charts/empty-state";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { defaultPeriod } from "@/components/widgets/spending/data";
import { loadMetricsParams } from "@/hooks/use-metrics-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { cn } from "@midday/ui/cn";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Overview | Midday",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Overview(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const { from, to } = loadMetricsParams(searchParams);

  batchPrefetch([
    trpc.assistant.history.queryOptions(),
    trpc.metrics.spending.queryOptions({
      from: defaultPeriod.from,
      to: defaultPeriod.to,
    }),
    trpc.invoice.get.queryOptions({ pageSize: 10 }),
    trpc.invoice.paymentStatus.queryOptions(),
    trpc.metrics.expense.queryOptions({ from, to }),
    trpc.metrics.profit.queryOptions({ from, to }),
    trpc.metrics.burnRate.queryOptions({ from, to }),
    trpc.metrics.runway.queryOptions({ from, to }),
  ]);

  // Preload the data for the first visible chart
  const [accounts] = await Promise.all([
    queryClient.fetchQuery(
      trpc.bankAccounts.get.queryOptions({
        enabled: true,
      }),
    ),
    queryClient.fetchQuery(
      trpc.metrics.revenue.queryOptions({
        from,
        to,
      }),
    ),
  ]);

  const isEmpty = !accounts?.data?.length;

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

        <Widgets disabled={false} />
      </div>

      {/* <OverviewModal defaultOpen={isEmpty && !hideConnectFlow} /> */}
    </HydrateClient>
  );
}
