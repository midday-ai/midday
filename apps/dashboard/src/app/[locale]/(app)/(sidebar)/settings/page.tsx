import { CompanyCountry } from "@/components/company-country";
import { CompanyEmail } from "@/components/company-email";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyName } from "@/components/company-name";
import { DeleteTeam } from "@/components/delete-team";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  prefetch(trpc.team.current.queryOptions());

  return (
    <div className="space-y-12">
      <CompanyLogo />
      <CompanyName />
      <CompanyEmail />
      <CompanyCountry />
      <DeleteTeam />
    </div>
  );
}
