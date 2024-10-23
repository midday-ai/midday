import type { Invoice } from "../tables/invoices/columns";

type Props = {
  invoice: Invoice;
};

export default function Template({ invoice }: Props) {
  return <div>Template</div>;
}
