"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useTRPC } from "@/trpc/client";
import { InvoiceSummary } from "./invoice-summary";

export function InvoicesOverdue() {
  const trpc = useTRPC();
  const { setFilter } = useInvoiceFilterParams();
  const { data } = useSuspenseQuery(
    trpc.invoice.invoiceSummary.queryOptions({
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
      <InvoiceSummary data={data} title="Overdue" />
    </button>
  );
}
