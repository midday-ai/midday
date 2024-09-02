"use client";

import { invalidateCacheAction } from "@/actions/invalidate-cache-action";
import { resumableUpload } from "@/utils/upload";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { nanoid } from "nanoid";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  teamId: string;
  children: ReactNode;
};

export function UploadZone({ children, teamId }: Props) {
  const supabase = createClient();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toastId, setToastId] = useState(null);
  const uploadProgress = useRef([]);
  const { toast, dismiss, update } = useToast();

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

    const filePath = [teamId, "inbox"];

    try {
      await Promise.all(
        files.map(async (file, idx) => {
          return resumableUpload(supabase, {
            bucket: "vault",
            path: filePath,
            // Add uploaded so we can filter background job on this
            file: new File([file], file.name.replace(".", ".uploaded."), {
              type: file.type,
            }),
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
      invalidateCacheAction([`vault_${teamId}`]);
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
    maxSize: 3000000, // 3MB
    maxFiles: 10,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div
      {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
      className="relative h-full"
    >
      <div className="absolute top-0 bottom-0 right-0 left-0 z-[51] pointer-events-none">
        <div
          className={cn(
            "bg-background dark:bg-[#1A1A1A] h-full flex items-center justify-center text-center invisible",
            isDragActive && "visible",
          )}
        >
          <input {...getInputProps()} id="upload-files" />
          <p className="text-xs">
            Drop your receipts here. <br />
            Maximum of 10 files at a time.
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
