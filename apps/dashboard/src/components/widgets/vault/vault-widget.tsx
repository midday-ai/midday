import { getUser } from "@midday/supabase/cached-queries";
import { getVaultActivityQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import Link from "next/link";
import { Vault } from "./vault";

export function VaultWidgetSkeleton() {
  return null;
}

export function VaultWidgetHeader() {
  return (
    <div>
      <Link href="/vault" prefetch>
        <h2 className="text-lg">Recent files</h2>
      </Link>
      <div className="flex py-3 border-b-[1px] justify-between mt-4">
        <span className="font-medium text-sm">Name</span>
        <span className="font-medium text-sm">Tag</span>
      </div>
    </div>
  );
}

export async function VaultWidget() {
  const supabase = createClient();
  const { data: userData } = await getUser();

  const { data: storageData } = await getVaultActivityQuery(
    supabase,
    userData?.team_id,
  );

  const files = storageData
    ?.filter((file) => file?.path_tokens.pop() !== ".emptyFolderPlaceholder")
    .map((file) => {
      const [_, ...pathWithoutTeamId] = file?.path_tokens ?? [];

      return {
        id: file.id,
        name: file.name?.split("/").at(-1),
        path: file.path_tokens,
        mimetype: file.metadata?.mimetype,
        team_id: file.team_id,
        tag: file.tag,
        filePath: pathWithoutTeamId?.join("/"),
      };
    });

  if (!files?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060] -mt-12">No files found</p>
      </div>
    );
  }

  return <Vault files={files} />;
}
