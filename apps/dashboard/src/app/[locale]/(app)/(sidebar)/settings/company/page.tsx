import type { Metadata } from "next";
import { CompanyAddress } from "@/components/company-address";
import { CompanyEmail } from "@/components/company-email";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyName } from "@/components/company-name";
import { CompanyVatNumber } from "@/components/company-vat-number";
import { EInvoiceRegistration } from "@/components/e-invoice-registration";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Company Settings | Midday",
};

export default async function CompanySettings() {
  prefetch(trpc.team.current.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-12">
        <CompanyLogo />
        <CompanyName />
        <CompanyEmail />
        <div id="address" className="scroll-mt-8">
          <CompanyAddress />
        </div>
        <div id="vat" className="scroll-mt-8">
          <CompanyVatNumber />
        </div>
        <div id="e-invoicing" className="scroll-mt-8">
          <EInvoiceRegistration />
        </div>
      </div>
    </HydrateClient>
  );
}
