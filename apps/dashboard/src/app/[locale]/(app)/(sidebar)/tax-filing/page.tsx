import { TaxFilingPage } from "@/components/tax-filing/tax-filing-page";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Filing | Midday",
};

export default async function TaxFiling() {
  const currentYear = new Date().getFullYear();

  prefetch(trpc.taxReports.getAvailableFiscalYears.queryOptions());
  prefetch(trpc.taxReports.getTaxFilingData.queryOptions({
    fiscalYear: currentYear - 1,
    reportType: "blue_return",
  }));

  return (
    <HydrateClient>
      <TaxFilingPage />
    </HydrateClient>
  );
}
