"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { resumableUpload } from "@/utils/upload";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

type UploadResult = {
  filename: string;
  file: File;
};

type ProcessAttachmentInput = {
  filePath: string[];
  mimetype: string;
  size: number;
};

type Props = {
  children: ReactNode;
  onUploadComplete?: () => void;
};

export function UploadZone({ children, onUploadComplete }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const supabase = createClient();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toastId, setToastId] = useState<string | undefined>(undefined);
  const uploadProgress = useRef<number[]>([]);
  const { toast, dismiss, update } = useToast();
  const processAttachmentsMutation = useMutation(
    trpc.inbox.processAttachments.mutationOptions(),
  );

  useEffect(() => {
    if (!toastId && showProgress) {
      const { id } = toast({
        title: `Uploading ${uploadProgress.current.length} files`,
        progress,
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Number.POSITIVE_INFINITY,
      });

      if (id) {
        setToastId(id);
      }
    } else if (toastId) {
      update(toastId, {
        id: toastId,
        progress,
        title: `Uploading ${uploadProgress.current.length} files`,
      });
    }
  }, [showProgress, progress, toastId]);

  const onDrop = async (files: File[]) => {
    // NOTE: If onDropRejected
    if (!files.length) {
      return;
    }

    // Set default progress
    uploadProgress.current = files.map(() => 0);

    setShowProgress(true);

    const path = [user?.teamId, "inbox"] as string[];

    try {
      const results = (await Promise.all(
        files.map(async (file: File, idx: number) =>
          resumableUpload(supabase, {
            bucket: "vault",
            path,
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
          }),
        ),
      )) as UploadResult[];

      // Trigger the upload jobs
      processAttachmentsMutation.mutate(
        results.map(
          (result): ProcessAttachmentInput => ({
            filePath: [...path, result.filename],
            mimetype: result.file.type,
            size: result.file.size,
          }),
        ),
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
      setToastId(undefined);
      dismiss(toastId);
      onUploadComplete?.();
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
    maxSize: 5000000, // 5MB
    maxFiles: 25,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"],
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
            Maximum of 25 files at a time.
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
