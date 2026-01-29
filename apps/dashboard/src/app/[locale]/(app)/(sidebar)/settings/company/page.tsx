import { CompanyAddress } from "@/components/company-address";
import { CompanyCountry } from "@/components/company-country";
import { CompanyEInvoice } from "@/components/company-e-invoice";
import { CompanyFiscalYear } from "@/components/company-fiscal-year";
import { CompanyTaxInfo } from "@/components/company-tax-info";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Settings | Midday",
};

export default async function CompanySettings() {
  prefetch(trpc.team.current.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-12">
        <CompanyAddress />
        <CompanyCountry />
        <CompanyFiscalYear />
        <CompanyTaxInfo />
        <CompanyEInvoice />
      </div>
    </HydrateClient>
  );
}
