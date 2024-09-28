import { EmptyStateInvoice } from "@/components/empty-state-invoice";
import { ContentLayout } from "@/components/panel/content-layout";
import config from "@/config";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";
  
export const metadata: Metadata = {
  title: `Invoices | ${config.company}`,
};

export default function Invoices() {
  const hasRequested = cookies().get(Cookies.RequestAccess)?.value === "true";

  return (
    <ContentLayout title="Invoices">
      <EmptyStateInvoice hasRequested={hasRequested} />
    </ContentLayout>
  );
}
