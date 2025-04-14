"use client";

import { invalidateCacheAction } from "@/actions/invalidate-cache-action";
import { useUserQuery } from "@/hooks/use-user";
import { useVaultContext } from "@/store/vault/hook";
import { resumableUpload } from "@/utils/upload";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { useToast } from "@midday/ui/use-toast";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DEFAULT_FOLDER_NAME } from "./contants";

type Props = {
  children: React.ReactNode;
};

export function UploadZone({ children }: Props) {
  const supabase = createClient();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toastId, setToastId] = useState(null);
  const uploadProgress = useRef([]);
  const params = useParams();
  const folders = params?.folders ?? [];
  const { toast, dismiss, update } = useToast();
  const { createFolder } = useVaultContext((s) => s);
  const { data: user } = useUserQuery();

  const isDefaultFolder = [
    "exports",
    "inbox",
    "import",
    "transactions",
  ].includes(folders?.at(0) ?? "");

  useEffect(() => {
    if (!toastId && showProgress) {
      const { id } = toast({
        title: `Uploading ${uploadProgress.current.length} files`,
        progress,
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Number.POSITIVE_INFINITY,
      });

      setToastId(id);
    } else {
      update(toastId, {
        progress,
        title: `Uploading ${uploadProgress.current.length} files`,
      });
    }
  }, [showProgress, progress, toastId]);

  const onDrop = async (files) => {
    // NOTE: If onDropRejected
    if (!files.length) {
      return;
    }

    // Set default progress
    uploadProgress.current = files.map(() => 0);

    setShowProgress(true);

    const filePath = [user?.team_id, ...folders];

    try {
      await Promise.all(
        files.map(async (file, idx) => {
          await resumableUpload(supabase, {
            bucket: "vault",
            path: filePath,
            file,
            onProgress: (bytesUploaded, bytesTotal) => {
              uploadProgress.current[idx] = (bytesUploaded / bytesTotal) * 100;

              const _progress = uploadProgress.current.reduce(
                (acc, currentValue) => {
                  return acc + currentValue;
                },
                0,
              );

              setProgress(Math.round(_progress / files.length));
            },
          });
        }),
      );

      // Reset once done
      uploadProgress.current = [];

      setProgress(0);
      toast({
        title: "Upload successful.",
        variant: "success",
        duration: 2000,
      });

      setShowProgress(false);
      setToastId(null);
      dismiss(toastId);
      invalidateCacheAction([`vault_${user?.team_id}`]);
    } catch {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: ([reject]) => {
      if (reject?.errors.find(({ code }) => code === "file-too-large")) {
        toast({
          duration: 2500,
          variant: "error",
          title: "File size to large.",
        });
      }

      if (reject?.errors.find(({ code }) => code === "file-invalid-type")) {
        toast({
          duration: 2500,
          variant: "error",
          title: "File type not supported.",
        });
      }
    },
    maxSize: 10000000, // 10MB
    accept: {
      "image/*": [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".heic",
        ".heif",
        ".avif",
        ".tiff",
        ".bmp",
      ],
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
      "application/rtf": [".rtf"],
      "application/x-rar-compressed": [".rar"],
      "application/x-7z-compressed": [".7z"],
      "application/xml": [".xml"],
      "application/json": [".json"],
      "application/vnd.oasis.opendocument.text": [".odt"],
      "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
      "application/vnd.oasis.opendocument.presentation": [".odp"],
    },
  });

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
                "bg-background dark:bg-[#1A1A1A] h-full flex items-center justify-center text-center invisible",
                isDragActive && "visible",
              )}
            >
              <input {...getInputProps()} id="upload-files" />

              <p className="text-xs">
                Drop your files here, to
                <br /> upload to this folder.
              </p>
            </div>
          </div>

          <div className="overflow-y-auto h-full scrollbar-hide">
            {children}
          </div>
        </div>
      </ContextMenuTrigger>

      {!isDefaultFolder && (
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => createFolder({ name: DEFAULT_FOLDER_NAME })}
          >
            Create folder
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
