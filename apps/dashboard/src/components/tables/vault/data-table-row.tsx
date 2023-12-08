"use client";

import { shareFileAction } from "@/actions/share-file-action";
import { FileIcon } from "@/components/file-icon";
import { useI18n } from "@/locales/client";
import { formatSize } from "@/utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import ms from "ms";
import { useAction } from "next-safe-action/hook";
import { useParams, usePathname, useRouter } from "next/navigation";

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
      return decodeURIComponent(folder);
  }
};

export function DataTableRow({ data, deleteFile, createFolder, deleteFolder }) {
  const t = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const folders = params?.folders ?? [];
  const isDefaultFolder = ["inbox", "exports", "transactions"].includes(
    data.name
  );

  const disableActions = ["transactions"].includes(folders?.at(0));
  const folderPath = folders.join("/");
  const filepath = [...folders, data.name].join("/");

  const shareFile = useAction(shareFileAction, {
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);

        toast({
          duration: 4000,
          title: `Copied URL for ${data.name} to clipboard.`,
          variant: "success",
        });
      } catch (err) {}
    },
  });

  const handleNavigate = () => {
    if (data.isFolder) {
      router.push(`${pathname}/${data.name}`);
    }
  };

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
            className="h-[45px] cursor-default"
            onClick={handleNavigate}
          >
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
              <div className="flex justify-between">
                <span>
                  {data?.updated_at
                    ? format(new Date(data.updated_at), "Pp")
                    : "-"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Icons.MoreHoriz />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56"
                    sideOffset={10}
                    align="end"
                  >
                    {!data.isFolder && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Share URL
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() =>
                                shareFile.execute({
                                  filepath,
                                  expireIn: ms("1 week"),
                                })
                              }
                            >
                              Expire in 1 week
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                shareFile.execute({
                                  filepath,
                                  expireIn: ms("1 month"),
                                })
                              }
                            >
                              Expire in 1 month
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                shareFile.execute({
                                  filepath,
                                  expireIn: ms("1 year"),
                                })
                              }
                            >
                              Expire in 1 year
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )}

                    {!disableActions && !isDefaultFolder && (
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      {data.isFolder ? (
                        <a
                          href={`/api/download/zip?path=${filepath}&filename=${data.name}`}
                          download
                          className="truncate"
                        >
                          Download
                        </a>
                      ) : (
                        <a
                          href={`/api/download/file?path=${folderPath}&filename=${data.name}`}
                          download
                          className="truncate"
                        >
                          Download
                        </a>
                      )}
                    </DropdownMenuItem>
                    {!disableActions && !isDefaultFolder && (
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </AlertDialogTrigger>
                    )}
                    {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {!data.isFolder && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Share URL</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ms("1 week"),
                    })
                  }
                >
                  Expire in 1 week
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ms("1 month"),
                    })
                  }
                >
                  Expire in 1 month
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    shareFile.execute({
                      filepath,
                      expireIn: ms("1 year"),
                    })
                  }
                >
                  Expire in 1 year
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuItem
            onClick={() =>
              createFolder.execute({
                path: folderPath,
                name: "Untitled folder",
              })
            }
          >
            Create folder
          </ContextMenuItem>
          {!disableActions && !isDefaultFolder && (
            <ContextMenuItem>Rename</ContextMenuItem>
          )}
          <ContextMenuItem>
            {data.isFolder ? (
              <a
                href={`/api/download/zip?path=${filepath}&filename=${data.name}`}
                download
                className="truncate"
              >
                Download
              </a>
            ) : (
              <a
                href={`/api/download/file?path=${folderPath}&filename=${data.name}`}
                download
                className="truncate"
              >
                Download
              </a>
            )}
          </ContextMenuItem>
          {!disableActions && !isDefaultFolder && (
            <AlertDialogTrigger asChild>
              <ContextMenuItem>Delete</ContextMenuItem>
            </AlertDialogTrigger>
          )}
        </ContextMenuContent>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (data.isFolder) {
                  deleteFolder({
                    path: [...folders, data.name],
                  });
                } else {
                  deleteFile({
                    id: data.id,
                    path: [...folders, data.name],
                  });
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </ContextMenu>
    </AlertDialog>
  );
}
