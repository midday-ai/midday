"use client";

import { useDealFilterParams } from "@/hooks/use-deal-filter-params";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DealSummary } from "./deal-summary";

export function DealsPaid() {
  const { setFilter } = useDealFilterParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.deal.dealSummary.queryOptions({
      statuses: ["paid"],
    }),
  );

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          statuses: ["paid"],
        })
      }
      className="hidden sm:block text-left"
    >
      <DealSummary data={data} title="Paid" />
    </button>
  );
}
