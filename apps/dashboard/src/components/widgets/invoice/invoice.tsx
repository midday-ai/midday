import type { RouterOutputs } from "@/trpc/routers/_app";
import { EmptyState } from "./empty-state";
import { InvoiceRow } from "./invoice-row";

type Props = {
  invoices: RouterOutputs["invoice"]["get"]["data"];
};

export function Invoice({ invoices }: Props) {
  if (!invoices?.length) {
    return <EmptyState />;
  }

  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-32 mt-4">
      {invoices?.map((invoice) => {
        return <InvoiceRow key={invoice.id} invoice={invoice} />;
      })}
    </ul>
  );
}
