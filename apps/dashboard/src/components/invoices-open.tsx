"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useTRPC } from "@/trpc/client";
import { InvoiceSummary } from "./invoice-summary";

export function InvoicesOpen() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.invoiceSummary.queryOptions({
      statuses: ["draft", "scheduled", "unpaid"],
    }),
  );

  const { setFilter } = useInvoiceFilterParams();

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
      <InvoiceSummary data={data} title="Open" />
    </button>
  );
}
