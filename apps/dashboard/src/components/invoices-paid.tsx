"use client";

import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { InvoiceSummary } from "./invoice-summary";

export function InvoicesPaid() {
  const { setFilter } = useInvoiceFilterParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.invoiceSummary.queryOptions({
      status: "paid",
    }),
  );

  const totalInvoiceCount = data?.at(0)?.invoice_count;

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
      <InvoiceSummary
        data={data}
        totalInvoiceCount={totalInvoiceCount ?? 0}
        title="Paid"
      />
    </button>
  );
}
