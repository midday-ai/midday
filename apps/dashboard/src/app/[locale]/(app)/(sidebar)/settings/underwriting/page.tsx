import { UnderwritingBuyBoxSettings } from "@/components/underwriting-buy-box-settings";
import { UnderwritingRequirementsEditor } from "@/components/underwriting-requirements-editor";
import { UnderwritingToggle } from "@/components/underwriting-toggle";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Underwriting Settings | abacus",
};

export default async function UnderwritingSettingsPage() {
  prefetch(trpc.team.current.queryOptions());
  prefetch(trpc.underwritingApplications.getRequirements.queryOptions());
  prefetch(trpc.underwriting.getBuyBox.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-12">
        <UnderwritingToggle />
        <UnderwritingRequirementsEditor />
        <UnderwritingBuyBoxSettings />
      </div>
    </HydrateClient>
  );
}
