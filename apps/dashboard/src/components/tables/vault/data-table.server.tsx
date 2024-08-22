import { VaultProvider } from "@/store/vault/provider";
import { getVault } from "@midday/supabase/cached-queries";
import { DataTable } from "./data-table";
import { EmptyTable } from "./empty-table";
import { UploadZone } from "./upload-zone";
import { VaultActions } from "./vault-actions";

type Props = {
  folders: string[];
  disableActions: boolean;
};

export async function DataTableServer({ folders, disableActions }: Props) {
  const path = folders.at(-1);

  const { data } = await getVault({
    path: path && decodeURIComponent(path),
  });

  return (
    <VaultProvider data={data}>
      <div className="relative">
        <VaultActions disableActions={disableActions} />

        <div className="mt-3 h-[calc(100vh-370px)] border overflow-scroll relative">
          <UploadZone>
            <DataTable />
            {data.length === 0 && <EmptyTable type={path} />}
          </UploadZone>
        </div>
      </div>
    </VaultProvider>
  );
}
