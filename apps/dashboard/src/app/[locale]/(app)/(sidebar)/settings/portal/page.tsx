import { CompanyLogo } from "@/components/company-logo";
import { CollectionsTeam } from "@/components/portal/collections-team";
import { DocumentSigners } from "@/components/portal/document-signers";
import { PortalDisplayName } from "@/components/portal/portal-display-name";
import { PortalEmailFromName } from "@/components/portal/portal-email-from-name";
import { PortalEmailReplyTo } from "@/components/portal/portal-email-reply-to";
import { PortalPdfFooterText } from "@/components/portal/portal-pdf-footer-text";
import { PortalPrimaryColor } from "@/components/portal/portal-primary-color";
import { PortalSecondaryColor } from "@/components/portal/portal-secondary-color";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Settings | Abacus",
};

export default async function PortalSettings() {
  prefetch(trpc.team.current.queryOptions());
  prefetch(trpc.team.members.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-12">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Portal Branding</h2>
          <p className="text-sm text-muted-foreground">
            Customize how your portal looks to merchants.
          </p>
        </div>

        <CompanyLogo />
        <PortalDisplayName />
        <PortalPrimaryColor />
        <PortalSecondaryColor />

        <div className="space-y-1 pt-4">
          <h2 className="text-lg font-medium">Collections Team</h2>
          <p className="text-sm text-muted-foreground">
            Assign team members who handle collections.
          </p>
        </div>

        <CollectionsTeam />

        <div className="space-y-1 pt-4">
          <h2 className="text-lg font-medium">Document Signers</h2>
          <p className="text-sm text-muted-foreground">
            Choose who signs each type of outbound document.
          </p>
        </div>

        <DocumentSigners />

        <div className="space-y-1 pt-4">
          <h2 className="text-lg font-medium">Email Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure how emails are sent to merchants.
          </p>
        </div>

        <PortalEmailFromName />
        <PortalEmailReplyTo />
        <PortalPdfFooterText />
      </div>
    </HydrateClient>
  );
}
