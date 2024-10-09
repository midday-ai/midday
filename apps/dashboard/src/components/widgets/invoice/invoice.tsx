import type { Invoice as InvoiceType } from "@/components/tables/invoices/columns";
import { InvoiceRow } from "./invoice-row";

type Props = {
  invoices: InvoiceType[];
};

export function Invoice({ invoices }: Props) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-32 mt-4">
      {invoices?.map((invoice) => {
        return <InvoiceRow key={invoice.id} invoice={invoice} />;
      })}
    </ul>
  );
}
