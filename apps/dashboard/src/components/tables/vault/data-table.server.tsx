import { VaultProvider } from "@/store/vault/provider";
import { getUser, getVault } from "@midday/supabase/cached-queries";
import { DataTable } from "./data-table";
import { EmptyTable } from "./empty-table";
import { UploadZone } from "./upload-zone";

type Props = {
  folders: string[];
  disableActions: boolean;
};

export async function DataTableServer({ folders }: Props) {
  const path = folders.at(-1);

  const { data } = await getVault({
    path: path && decodeURIComponent(path),
  });

  const { data: userData } = await getUser();

  return (
    <VaultProvider data={data}>
      <div className="mt-6 h-[calc(100vh-400px)] border overflow-scroll relative">
        <UploadZone>
          <DataTable teamId={userData.team_id} />
          {data.length === 0 && <EmptyTable type={path} />}
        </UploadZone>
      </div>
    </VaultProvider>
  );
}
