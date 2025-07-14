import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { DeleteApiKeyModal } from "@/components/modals/delete-api-key-modal";
import { EditApiKeyModal } from "@/components/modals/edit-api-key-modal";
import { OAuthApplicationCreateSheet } from "@/components/sheets/oauth-application-create-sheet";
import { OAuthApplicationEditSheet } from "@/components/sheets/oauth-application-edit-sheet";
import { DataTable } from "@/components/tables/api-keys";
import { OAuthDataTable } from "@/components/tables/oauth-applications";
import { batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | Midday",
};

export default async function Page() {
  batchPrefetch([
    trpc.apiKeys.get.queryOptions(),
    trpc.oauthApplications.list.queryOptions(),
  ]);

  return (
    <>
      <div className="space-y-12">
        <DataTable />
        <OAuthDataTable />
      </div>

      <EditApiKeyModal />
      <DeleteApiKeyModal />
      <CreateApiKeyModal />
      <OAuthApplicationCreateSheet />
      <OAuthApplicationEditSheet />
    </>
  );
}
