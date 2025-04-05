import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { EmptyState } from "@/components/charts/empty-state";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { cn } from "@midday/ui/cn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

// const defaultValue = {
//   from: subMonths(startOfMonth(new Date()), 12).toISOString(),
//   to: new Date().toISOString(),
//   period: "monthly",
// };

export default async function Overview(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // const searchParams = await props.searchParams;
  // const accounts = await getTeamBankAccounts();

  // const isEmpty = !accounts?.data?.length;
  const isEmpty = false;

  return (
    <>
      <div>
        <div className="h-[530px] mb-4">
          {/* <ChartSelectors defaultValue={defaultValue} /> */}

          <div className="mt-8 relative">
            {isEmpty && <EmptyState />}

            <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
              {/* <Charts
                value={value}
                defaultValue={defaultValue}
                disabled={isEmpty}
                type={chartType}
                currency={searchParams.currency}
              /> */}
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
    </>
  );
}
