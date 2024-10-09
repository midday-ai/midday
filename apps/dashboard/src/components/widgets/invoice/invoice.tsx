import { InvoiceStatus } from "@/components/invoice-status";

type Props = {
  invoices: InvoiceType[];
};

export function Invoice({ invoices }: Props) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {invoices?.map((invoice) => (
        <li key={invoice.id}>
          <div className="flex items-center py-3">
            <div className="w-[55%]">
              <span className="text-sm line-clamp-1">{invoice.name}</span>
            </div>
            <div className="ml-auto w-[40%] flex justify-end">
              <InvoiceStatus status={invoice.status} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
