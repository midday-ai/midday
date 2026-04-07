import { Customers } from "@/components/customers";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Customer Management & Revenue Tracking",
  description:
    "Know your customers better. Track customer performance, payment history, and outstanding invoices all in one place.",
  path: "/customers",
  og: {
    title: "Customers",
    description: "Track revenue, payments, and invoices per customer",
  },
});

export default function Page() {
  return <Customers />;
}
