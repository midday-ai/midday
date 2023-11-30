"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { invalidateCacheAction } from "@/actions/invalidate-cache-action";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { upload } from "@midday/supabase/storage";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/utils";
import { useAction } from "next-safe-action/hook";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";

export function UploadZone({ children }) {
  const supabase = createClient();
  const params = useParams();
  const folders = params?.folders ?? [];
  const folderPath = folders.join("/");
  const { toast } = useToast();

  const isDefaultFolder = ["inbox", "exports", "transactions"].includes(
    folders.at(0)
  );

  const createFolder = useAction(createFolderAction, {
    onError: () => {
      toast({
        duration: 4000,
        description:
          "The folder already exists in the current directory. Please use a different name.",
      });
    },
  });

  const onDrop = async (files) => {
    const { data: userData } = await getCurrentUserTeamQuery(supabase);

    await Promise.all(
      files.map(async (file) => {
        await upload(supabase, {
          bucket: "vault",
          path: `${userData?.team_id}/${folderPath}`,
          file,
        });
      })
    );

    invalidateCacheAction([`vault_${userData.team_id}`]);

    toast({
      duration: 4000,
      description: "Upload successfull.",
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
          className="relative h-full"
        >
          <div className="absolute top-0 bottom-0 right-0 left-0 z-50 pointer-events-none">
            <div
              className={cn(
                "bg-[#1A1A1A] h-full flex items-center justify-center text-center invisible",
                isDragActive && "visible"
              )}
            >
              <input {...getInputProps()} />

              <p className="text-xs">
                Drop your files here, to
                <br /> upload to this folder.{" "}
              </p>
            </div>
          </div>

          {children}
        </div>
      </ContextMenuTrigger>

      {!isDefaultFolder && (
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() =>
              createFolder.execute({
                path: folderPath,
                name: "Untitled folder",
              })
            }
          >
            Upload file
          </ContextMenuItem>

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
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
