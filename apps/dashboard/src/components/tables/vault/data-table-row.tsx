"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { deleteFileAction } from "@/actions/delete-file-action";
import { deleteFolderAction } from "@/actions/delete-folder-action";
import { shareFileAction } from "@/actions/share-file-action";
import { updateDocumentAction } from "@/actions/update-document-action";
import { AssignedUser } from "@/components/assigned-user";
import { FileIcon } from "@/components/file-icon";
import { FilePreview } from "@/components/file-preview";
import { SelectTag } from "@/components/select-tag";
import { useI18n } from "@/locales/client";
import { useUserContext } from "@/store/user/hook";
import { useVaultContext } from "@/store/vault/hook";
import { formatDate, formatSize } from "@/utils/format";
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
import { isSupportedFilePreview } from "@midday/utils";
import ms from "ms";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { DEFAULT_FOLDER_NAME } from "./contants";
import { Tag } from "./tag";

export const translatedFolderName = (t: any, folder: string) => {
  switch (folder) {
    case "all":
      return t("folders.all");
    case "exports":
      return t("folders.exports");
    case "inbox":
      return t("folders.inbox");
    case "imports":
      return t("folders.imports");
    case "transactions":
      return t("folders.transactions");
    case "invoices":
      return t("folders.invoices");
    default:
      return decodeURIComponent(folder);
  }
};

type Props = {
  isEditing: boolean;
  name: string;
  path: string;
  href: string;
};

function RowTitle({ name: initialName, isEditing, path, href }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();
  const [canceled, setCanceled] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState(initialName ?? DEFAULT_FOLDER_NAME);
  const { deleteItem, data } = useVaultContext((s) => s);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isEditing]);

  useHotkeys(
    "esc",
    () => {
      const name = initialName ?? DEFAULT_FOLDER_NAME;
      deleteItem(name);
      setCanceled(true);
    },
    { enableOnFormTags: true, enabled: isEditing },
  );

  const createFolder = useAction(createFolderAction, {
    onExecute: () => {},
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title:
          "A folder with this name already exists. Please use a different name.",
      });
    },
  });

  const checkAndCreateFolder = () => {
    if (
      !canceled &&
      name === initialName &&
      data.some((folder) => folder.name === name && folder.isFolder)
    ) {
      return;
    }

    createFolder.execute({ path, name });
  };

  const handleOnKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      checkAndCreateFolder();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        className="w-auto border-0 h-auto p-0"
        value={name}
        onBlur={checkAndCreateFolder}
        onKeyDown={handleOnKeyDown}
        onChange={(evt) => setName(evt.target.value)}
        onFocus={(evt) => evt.target.select()}
      />
    );
  }

  if (href) {
    return (
      <Link prefetch href={href}>
        {translatedFolderName(t, name)}
      </Link>
    );
  }

  return (
    <span className="line-clamp-1 max-w-[70%]">
      {translatedFolderName(t, name)}
    </span>
  );
}

export function DataTableRow({ data }: { data: any }) {
  const { toast } = useToast();
  const pathname = usePathname();
  const params = useParams();
  const updateDocument = useAction(updateDocumentAction);
  const { deleteItem, createFolder } = useVaultContext((s) => s);
  const { date_format: dateFormat } = useUserContext((state) => state.data);

  const folders = params?.folders ?? [];
  const isDefaultFolder = [
    "exports",
    "transactions",
    "inbox",
    "import",
    "invoices",
  ].includes(data.name);

  const disableActions = ["transactions"].includes(folders?.at(0));
  const folderPath = folders.join("/");
  const [_, ...pathWithoutTeamId] = data?.path_tokens ?? [];

  const filepath = pathWithoutTeamId?.join("/");
  const oldFilepath = [...folders, data.name].join("/");

  const deleteFolder = useAction(deleteFolderAction, {
    onExecute: () => deleteItem(data.name),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const deleteFile = useAction(deleteFileAction, {
    onExecute: ({ input: { id } }) => deleteItem(id),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
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
    createFolder({ name: DEFAULT_FOLDER_NAME });
  };

  const shareFile = useAction(shareFileAction, {
    onSuccess: async ({ data: url }) => {
      try {
        await navigator.clipboard.writeText(url);

        toast({
          duration: 4000,
          title: `Copied URL for ${data.name} to clipboard.`,
          variant: "success",
        });
      } catch {}
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
                <HoverCardTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <FileIcon
                      mimetype={data?.metadata?.mimetype}
                      name={data.name}
                      isFolder={data.isFolder}
                    />

                    <RowTitle
                      isEditing={Boolean(data.isEditing)}
                      href={data.isFolder && `${pathname}/${data.name}`}
                      name={data.name}
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
                  <HoverCardContent className="w-[273px] h-[358px] p-0 overflow-hidden">
                    <FilePreview
                      width={280}
                      height={365}
                      src={`/api/proxy?filePath=vault/${data.team_id}/${filepath}`}
                      downloadUrl={`/api/download/file?path=${filepath}&filename=${data.name}`}
                      name={data.name}
                      type={data?.metadata?.mimetype}
                    />
                  </HoverCardContent>
                )}
              </HoverCard>
            </TableCell>
            <TableCell>
              <AssignedUser
                fullName={data?.owner?.full_name}
                avatarUrl={data?.owner?.avatar_url}
              />
            </TableCell>
            <TableCell>
              <Tag name={data.tag} />
            </TableCell>
            <TableCell>
              {data?.created_at ? formatDate(data.created_at, dateFormat) : "-"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Icons.MoreHoriz />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-42"
                  sideOffset={10}
                  align="end"
                >
                  {!disableActions && !isDefaultFolder && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Edit tag</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <SelectTag
                            headless
                            selectedId={data.tag}
                            onChange={(tag) => {
                              updateDocument.execute({
                                id: data.id,
                                tag: tag.slug,
                              });
                            }}
                          />
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {!data.isFolder && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Share URL</DropdownMenuSubTrigger>
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

                  <DropdownMenuItem>
                    {data.isFolder ? (
                      <a
                        href={`/api/download/zip?path=${oldFilepath}/${data.name}&filename=${data.name}`}
                        download
                        className="truncate w-full"
                      >
                        Download
                      </a>
                    ) : (
                      <a
                        href={`/api/download/file?path=${filepath}&filename=${data.name}`}
                        download
                        className="truncate w-full"
                      >
                        Download
                      </a>
                    )}
                  </DropdownMenuItem>
                  {!disableActions && !isDefaultFolder && (
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
          <ContextMenuItem>
            {data.isFolder ? (
              <a
                href={`/api/download/zip?path=${oldFilepath}/${data.name}&filename=${data.name}`}
                download
                className="truncate"
              >
                Download
              </a>
            ) : (
              <a
                href={`/api/download/file?path=${filepath}&filename=${data.name}`}
                download
                className="truncate"
              >
                Download
              </a>
            )}
          </ContextMenuItem>
          {!disableActions && !isDefaultFolder && (
            <AlertDialogTrigger asChild>
              <ContextMenuItem className="text-destructive">
                Delete
              </ContextMenuItem>
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
