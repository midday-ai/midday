import { Invoicing } from "@/components/invoicing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice",
  description:
    "Create web-based invoices in seconds. Have an easy overview of all your invoices and see your outstanding balance.",
};

export default function Page() {
  return <Invoicing />;
}
