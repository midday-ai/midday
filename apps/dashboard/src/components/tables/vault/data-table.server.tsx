import { VaultProvider } from "@/store/vault/provider";
import { getVaultQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { DataTable } from "./data-table";
import { EmptyTable } from "./empty-table";
import { UploadZone } from "./upload-zone";
import { VaultActions } from "./vault-actions";

type Props = {
  folders: string[];
  disableActions: boolean;
  teamId: string;
};

export async function DataTableServer({
  folders,
  disableActions,
  filter,
  teamId,
}: Props) {
  const parentId = folders.at(-1);
  const supabase = createClient();

  const { data } = await getVaultQuery(supabase, {
    teamId,
    parentId: parentId && decodeURIComponent(parentId),
    filter,
    searchQuery: filter?.q,
  });

  const isSearch = Object.values(filter).some((value) => value !== null);

  return (
    <VaultProvider data={data}>
      <div className="relative">
        <VaultActions disableActions={disableActions} />

        <div className="mt-3 h-[calc(100vh-380px)] border">
          <UploadZone>
            <DataTable teamId={teamId} />

            {data.length === 0 && (
              <EmptyTable type={isSearch ? "search" : parentId} />
            )}
          </UploadZone>
        </div>
      </div>
    </VaultProvider>
  );
}
