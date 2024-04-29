import { getUser } from "@midday/supabase/cached-queries";
import { getVaultActivityQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

import { VaultPreview } from "./vault-preview";

// TODO: Translate
const defaultFolders = [
  { id: "inbox", name: "Inbox" },
  { id: "exports", name: "Exports" },
  { id: "imports", name: "Imports" },
  { id: "transactions", name: "Transactions" },
];

export async function VaultActivity() {
  const supabase = createClient({ db: { schema: "storage" } });
  const { data: userData } = await getUser();

  const { data: storageData } = await getVaultActivityQuery(
    supabase,
    userData.id
  );

  const files = storageData
    ?.filter((file) => file.path_tokens.pop() !== ".emptyFolderPlaceholder")
    .map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path_tokens,
      size: file.metadata.size,
      mimetype: file.metadata.mimetype,
      createdAt: file.created_at,
    }));

  return (
    <div className="mt-6 mb-10">
      <span className="text-sm font-medium">Recent activity</span>

      <div className="flex space-x-20 mt-6 overflow-auto w-[calc(100vw-130px)] scrollbar-hide">
        {files?.map((file) => {
          return <VaultPreview file={file} />;
        })}

        {defaultFolders.map((folder) => {
          return (
            <Link key={folder.name} href={`/vault/${folder.id}`}>
              <div className="text-center flex flex-col items-center">
                <Icons.Folder
                  size={65}
                  className="text-[#878787] dark:text-[#2C2C2C] mb-0"
                />
                <span className="text-sm truncate w-[70px]">{folder.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
