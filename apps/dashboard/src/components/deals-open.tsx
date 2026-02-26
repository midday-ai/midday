"use client";

import { useDealFilterParams } from "@/hooks/use-deal-filter-params";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DealSummary } from "./deal-summary";

export function DealsOpen() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.deal.dealSummary.queryOptions({
      statuses: ["draft", "scheduled", "unpaid"],
    }),
  );

  const { setFilter } = useDealFilterParams();

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          statuses: ["draft", "scheduled", "unpaid"],
        })
      }
      className="hidden sm:block text-left"
    >
      <DealSummary data={data} title="Open" />
    </button>
  );
}
