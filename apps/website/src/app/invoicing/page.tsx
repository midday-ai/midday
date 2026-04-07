import { Invoicing } from "@/components/invoicing";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Online Invoicing Software for Small Business",
  description:
    "Create professional invoices in seconds. Track payments, send reminders, and get paid faster with invoicing software built for small business owners.",
  path: "/invoicing",
  og: {
    title: "Invoicing",
    description: "Get paid faster with professional invoices",
  },
  keywords: [
    "invoice software",
    "small business invoicing",
    "online invoicing",
    "invoice generator",
    "billing software",
  ],
});

export default function Page() {
  return <Invoicing />;
}
