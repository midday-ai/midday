import { EmptyStateInvoice } from "@/components/empty-state-invoice";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

export default function Invoices() {
  const hasRequested = cookies().get(Cookies.RequestAccess)?.value === "true";

  return <EmptyStateInvoice hasRequested={hasRequested} />;
}
