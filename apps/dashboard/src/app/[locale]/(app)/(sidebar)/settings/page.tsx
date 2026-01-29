import { BaseCurrency } from "@/components/base-currency/base-currency";
import { CompanyEmail } from "@/components/company-email";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyName } from "@/components/company-name";
import { DeleteTeam } from "@/components/delete-team";
import { TeamIdSection } from "@/components/team-id-section";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  prefetch(trpc.team.current.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-12">
        <CompanyLogo />
        <CompanyName />
        <CompanyEmail />
        <BaseCurrency />
        <TeamIdSection />
        <DeleteTeam />
      </div>
    </HydrateClient>
  );
}
