"use client";

import { useDealFilterParams } from "@/hooks/use-deal-filter-params";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DealSummary } from "./deal-summary";

export function DealsOverdue() {
  const trpc = useTRPC();
  const { setFilter } = useDealFilterParams();
  const { data } = useSuspenseQuery(
    trpc.deal.dealSummary.queryOptions({
      statuses: ["overdue"],
    }),
  );

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          statuses: ["overdue"],
        })
      }
      className="hidden sm:block text-left"
    >
      <DealSummary data={data} title="Overdue" />
    </button>
  );
}
