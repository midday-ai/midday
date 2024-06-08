import { Breadcrumbs } from "@/components/breadcrumbs";
import { VaultActivity } from "@/components/vault-activity";
import { VaultProvider } from "@/store/vault/provider";
import { getUser, getVault } from "@midday/supabase/cached-queries";
import { CreateFolderButton } from "./create-folder-button";
import { DataTable } from "./data-table";
import { EmptyTable } from "./empty-table";
import { UploadButton } from "./upload-button";
import { UploadZone } from "./upload-zone";

export async function Table({ folders, disableActions }) {
  const path = folders?.join("/");

  const { data } = await getVault({
    path: path && decodeURIComponent(path),
  });

  const { data: userData } = await getUser();

  return (
    <div>
      <VaultProvider data={data}>
        <VaultActivity />

        <div className="flex justify-between items-center h-[32px] mt-6">
          <Breadcrumbs folders={folders} />

          <div className="flex space-x-2">
            <CreateFolderButton disableActions={disableActions} />
            <UploadButton disableActions={disableActions} />
          </div>
        </div>

        <div className="mt-6 h-[calc(100vh-400px)] border overflow-scroll relative">
          <UploadZone>
            <DataTable teamId={userData.team_id} />
            {data.length === 0 && <EmptyTable type={path} />}
          </UploadZone>
        </div>
      </VaultProvider>
    </div>
  );
}
