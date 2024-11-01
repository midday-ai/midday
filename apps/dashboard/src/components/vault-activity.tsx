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
  { id: "invoices", name: "Invoices" },
];

export async function VaultActivity() {
  const supabase = createClient();
  const { data: userData } = await getUser();

  const { data: storageData } = await getVaultActivityQuery(
    supabase,
    userData?.team_id,
  );

  const files = storageData
    ?.filter((file) => file.path_tokens.pop() !== ".emptyFolderPlaceholder")
    .map((file) => {
      const filename = file.name.split("/").at(-1);

      return {
        id: file.id,
        name: file.name,
        path: [...file.path_tokens, filename],
        size: file.metadata?.size ?? 0,
        mimetype: file.metadata?.mimetype,
        createdAt: file.created_at,
      };
    });

  return (
    <div className="my-6">
      <span className="text-sm font-medium">Recent activity</span>

      <div className="flex space-x-20 mt-6 overflow-auto w-full md:w-[calc(100vw-130px)] scrollbar-hide h-[130px]">
        {files?.map((file) => {
          return (
            <div className="w-[80px]" key={file.id}>
              <VaultPreview file={file} />
            </div>
          );
        })}

        {defaultFolders.map((folder) => {
          return (
            <div className="w-[80px]" key={folder.id}>
              <Link href={`/vault/${folder.id}`} prefetch>
                <div className="text-center flex flex-col items-center">
                  <Icons.Folder
                    size={65}
                    className="text-[#878787] dark:text-[#2C2C2C] mb-0"
                  />
                  <span className="text-sm truncate w-[70px]">
                    {folder.name}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
