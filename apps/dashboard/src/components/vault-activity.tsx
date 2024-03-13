import { FilePreview } from "@/components/file-preview";
import { formatSize } from "@/utils/format";
import { getUser } from "@midday/supabase/cached-queries";
import { getVaultActivityQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Icons } from "@midday/ui/icons";
import { isSupportedFilePreview } from "@midday/utils";
import Link from "next/link";
import { FileIcon } from "./file-icon";

// TODO: Translate
const defaultFolders = [
  { id: "inbox", name: "Inbox" },
  { id: "exports", name: "Exports" },
  { id: "imports", name: "Imports" },
  { id: "transactions", name: "Transactions" },
];

export async function VaultActivity() {
  const supabase = createClient({ schema: "storage" });
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
        {files.map((file) => {
          const filename = file.name.split("/").pop();
          // NOTE: Remove teamId from path
          const [, ...rest] = file.path;
          const downloadPath = [rest, filename].join("/");

          if (isSupportedFilePreview(file.mimetype)) {
            return (
              <HoverCard openDelay={200}>
                <HoverCardTrigger
                  className="text-center flex flex-col items-center"
                  key={file.id}
                >
                  <div className="w-[65px] h-[75px] bg-[#F2F1EF] dark:bg-secondary flex items-center justify-center p-2 overflow-hidden mb-2">
                    <FilePreview
                      src={`/api/proxy?filePath=vault/${file.name}`}
                      name={file.name}
                      type={file.mimetype}
                      preview
                      width={45}
                      height={57}
                    />
                  </div>

                  <span className="text-sm truncate w-[70px]">{filename}</span>
                  <span className="text-sm mt-1 text-[#878787]">
                    {formatSize(file.size)}
                  </span>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-[273px] h-[358px] p-0 overflow-hidden"
                  sideOffset={-40}
                >
                  <FilePreview
                    src={`/api/proxy?filePath=vault/${file.name}`}
                    downloadUrl={`/api/download/file?path=${downloadPath}&filename=${filename}`}
                    name={file.name}
                    type={file.mimetype}
                    width={280}
                    height={365}
                  />
                </HoverCardContent>
              </HoverCard>
            );
          }

          return (
            <div
              className="text-center flex flex-col items-center"
              key={file.id}
            >
              <FileIcon
                isFolder={false}
                mimetype={file.mimetype}
                name={file.name}
                size={65}
                className="dark:text-[#2C2C2C] mb-0"
              />
              <span className="text-sm truncate w-[70px]">{filename}</span>
              <span className="text-sm mt-1 text-[#878787]">
                {formatSize(file.size)}
              </span>
            </div>
          );
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
