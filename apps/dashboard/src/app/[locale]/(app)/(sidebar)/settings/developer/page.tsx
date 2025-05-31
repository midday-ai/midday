import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { DeleteApiKeyModal } from "@/components/modals/delete-api-key-modal";
import { EditApiKeyModal } from "@/components/modals/edit-api-key-modal";
import { DataTable } from "@/components/tables/api-keys";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | Midday",
};

export default async function Page() {
  prefetch(trpc.apiKeys.get.queryOptions());

  return (
    <>
      <div className="space-y-12">
        <DataTable />
      </div>

      <EditApiKeyModal />
      <DeleteApiKeyModal />
      <CreateApiKeyModal />
    </>
  );
}
