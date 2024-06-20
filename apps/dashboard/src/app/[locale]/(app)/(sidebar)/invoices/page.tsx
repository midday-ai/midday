import { EmptyStateInvoice } from "@/components/empty-state-invoice";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

export default function Invoices() {
  return <EmptyStateInvoice />;
}
