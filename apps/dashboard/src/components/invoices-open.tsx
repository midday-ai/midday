"use client";

import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { InvoiceSummary } from "./invoice-summary";

export function InvoicesOpen() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.invoice.invoiceSummary.queryOptions({
      status: "unpaid",
    }),
  );
  const { setFilter } = useInvoiceFilterParams();

  const totalInvoiceCount = data?.reduce(
    (acc, curr) => acc + (curr.invoiceCount ?? 0),
    0,
  );

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          statuses: ["draft", "overdue", "unpaid"],
        })
      }
      className="hidden sm:block text-left"
    >
      <InvoiceSummary
        data={data}
        totalInvoiceCount={totalInvoiceCount ?? 0}
        title="Open"
      />
    </button>
  );
}
