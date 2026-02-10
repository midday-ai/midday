"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useTRPC } from "@/trpc/client";
import { InvoiceSummary } from "./invoice-summary";

export function InvoicesPaid() {
  const { setFilter } = useInvoiceFilterParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.invoiceSummary.queryOptions({
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
      <InvoiceSummary data={data} title="Paid" />
    </button>
  );
}
