"use client";

import { FileIcon } from "@/components/file-icon";
import { useI18n } from "@/locales/client";
import { formatSize } from "@/utils/format";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { TableCell, TableRow } from "@midday/ui/table";
import { format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";

export const translatedFolderName = (t: any, folder: string) => {
  switch (folder) {
    case "all":
      return t("folders.all");
    case "inbox":
      return t("folders.inbox");
    case "transactions":
      return t("folders.transactions");
    case "exports":
      return t("folders.exports");

    default:
      return folder;
  }
};

export function DataTableRow({ data }) {
  const t = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = () => {
    if (data.isFolder) {
      router.push(`${pathname}/${data.name}`);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow className="h-[45px] cursor-default" onClick={handleNavigate}>
          <TableCell>
            <div className="flex items-center space-x-2">
              <FileIcon
                mimetype={data?.metadata?.mimetype}
                name={data.name}
                isFolder={data.isFolder}
              />
              <span>{translatedFolderName(t, data.name)}</span>
              {data?.metadata?.size && (
                <span className="text-[#878787]">
                  {formatSize(data.metadata.size)}
                </span>
              )}
            </div>
          </TableCell>
          <TableCell>
            {data?.created_at ? format(new Date(data.created_at), "Pp") : "-"}
          </TableCell>
          <TableCell>
            {data?.updated_at ? format(new Date(data.updated_at), "Pp") : "-"}
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Get URL</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Expire in 1 week</ContextMenuItem>
            <ContextMenuItem>Expire in 1 month</ContextMenuItem>
            <ContextMenuItem>Expire in 1 year</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem>Download</ContextMenuItem>
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
