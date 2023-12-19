"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { deleteFileAction } from "@/actions/delete-file-action";
import { deleteFolderAction } from "@/actions/delete-folder-action";
import { shareFileAction } from "@/actions/share-file-action";
import { FileIcon } from "@/components/file-icon";
import { FilePreview, isSupportedFilePreview } from "@/components/file-preview";
import { useI18n } from "@/locales/client";
import { useVaultContext } from "@/store/vault/hook";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import ms from "ms";
import { useAction } from "next-safe-action/hook";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export const translatedFolderName = (t: any, folder: string) => {
  switch (folder) {
    case "all":
      return t("folders.all");
    case "exports":
      return t("folders.exports");
    default:
      return decodeURIComponent(folder);
  }
};

function RowTitle({ isEditing, name: initialName, path, href }) {
  const t = useI18n();
  const { toast } = useToast();
  const [name, setName] = useState(initialName ?? "Untitled Folder");

  const createFolder = useAction(createFolderAction, {
    onExecute: () => {},
    onError: () => {
      toast({
        duration: 3500,
        title:
          "The folder already exists in the current directory. Please use a different name.",
      });
    },
  });

  const handleOnBlur = () => {
    createFolder.execute({ path, name });
  };

  const handleOnKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      createFolder.execute({ path, name });
    }
  };

  if (isEditing) {
    return (
      <Input
        className="w-auto border-0"
        value={name}
        autoFocus
        onBlur={handleOnBlur}
        onKeyDown={handleOnKeyDown}
        onChange={(evt) => setName(evt.target.value)}
      />
    );
  }

  if (href) {
    return <Link href={href}>{translatedFolderName(t, name)}</Link>;
  }

  return <span>{translatedFolderName(t, name)}</span>;
}

export function DataTableRow({ data, teamId }) {
  const { toast } = useToast();
  const pathname = usePathname();
  const params = useParams();
  const { deleteItem, createFolder } = useVaultContext((s) => s);

  const folders = params?.folders ?? [];
  const isDefaultFolder = ["exports"].includes(data.name);

  const disableActions = ["transactions"].includes(folders?.at(0));
  const folderPath = folders.join("/");
  const filepath = [...folders, data.name].join("/");

  const deleteFolder = useAction(deleteFolderAction, {
    onExecute: () => deleteItem(data.name),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const deleteFile = useAction(deleteFileAction, {
    onExecute: ({ id }) => deleteItem(id),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const handleDeleteItem = () => {
    if (data.isFolder) {
      deleteFolder.execute({ path: [...folders, data.name] });
    } else {
      deleteFile.execute({ id: data.id, path: [...folders, data.name] });
    }
  };

  const handleCreateFolder = () => {
    createFolder({ path: folderPath, name: "Untitled folder" });
  };

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

  const filePreviewSupported = isSupportedFilePreview(data?.metadata?.mimetype);

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow className="h-[45px] cursor-default">
            <TableCell>
              <HoverCard openDelay={200}>
                <HoverCardTrigger>
                  <div className="flex items-center space-x-2">
                    <FileIcon
                      mimetype={data?.metadata?.mimetype}
                      name={data.name}
                      isFolder={data.isFolder}
                    />

                    <RowTitle
                      href={data.isFolder && `${pathname}/${data.name}`}
                      name={data.name}
                      isEditing={data.isEditing}
                      path={folderPath}
                    />

                    {data?.metadata?.size && (
                      <span className="text-[#878787]">
                        {formatSize(data.metadata.size)}
                      </span>
                    )}
                  </div>
                </HoverCardTrigger>
                {filePreviewSupported && (
                  <HoverCardContent className="w-70 h-[350px]">
                    <FilePreview
                      width={300}
                      height={315}
                      src={`/api/proxy?filePath=vault/${teamId}/${filepath}`}
                      downloadUrl={`/api/download/file?path=${filepath}&filename=${data.name}`}
                      name={data.name}
                      type={data?.metadata?.mimetype}
                    />
                  </HoverCardContent>
                )}
              </HoverCard>
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
                    className="w-42"
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
                                  expireIn: ms("7d"),
                                })
                              }
                            >
                              Expire in 1 week
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                shareFile.execute({
                                  filepath,
                                  expireIn: ms("30d"),
                                })
                              }
                            >
                              Expire in 1 month
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                shareFile.execute({
                                  filepath,
                                  expireIn: ms("1y"),
                                })
                              }
                            >
                              Expire in 1 year
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )}

                    {/* {!disableActions && !isDefaultFolder && (
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                    )} */}
                    <DropdownMenuItem>
                      {data.isFolder ? (
                        <a
                          href={`/api/download/zip?path=${filepath}/${data.name}&filename=${data.name}`}
                          download
                          className="truncate w-full"
                        >
                          Download
                        </a>
                      ) : (
                        <a
                          href={`/api/download/file?path=${folderPath}/${data.name}&filename=${data.name}`}
                          download
                          className="truncate w-full"
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
          {!disableActions && (
            <ContextMenuItem onClick={handleCreateFolder}>
              Create folder
            </ContextMenuItem>
          )}
          {/* {!disableActions && !isDefaultFolder && (
            <ContextMenuItem>Rename</ContextMenuItem>
          )} */}
          <ContextMenuItem>
            {data.isFolder ? (
              <a
                href={`/api/download/zip?path=${filepath}/${data.name}&filename=${data.name}`}
                download
                className="truncate"
              >
                Download
              </a>
            ) : (
              <a
                href={`/api/download/file?path=${folderPath}/${data.name}&filename=${data.name}`}
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
            <AlertDialogAction onClick={handleDeleteItem}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </ContextMenu>
    </AlertDialog>
  );
}
