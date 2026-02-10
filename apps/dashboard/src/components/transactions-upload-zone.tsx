"use client";

import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUserQuery } from "@/hooks/use-user";
import { usePendingUploadsStore } from "@/store/pending-uploads";
import { useTRPC } from "@/trpc/client";
import { resumableUpload } from "@/utils/upload";

// Shared toast ID for coordinating between upload zone and data table
export const PROCESSING_TOAST_ID = "transactions-processing";

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
};

export function TransactionsUploadZone({ children }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toastId, setToastId] = useState<string | undefined>(undefined);
  const uploadProgress = useRef<number[]>([]);
  const { toast, dismiss, update } = useToast();
  const addPending = usePendingUploadsStore((state) => state.addPending);
  const processAttachmentsMutation = useMutation(
    trpc.inbox.processAttachments.mutationOptions(),
  );
  const createInboxItemMutation = useMutation(
    trpc.inbox.create.mutationOptions(),
  );

  useEffect(() => {
    if (!toastId && showProgress) {
      const { id } = toast({
        title: `Uploading ${uploadProgress.current.length} files`,
        progress,
        variant: "progress",
        description: "Files will be matched to transactions automatically",
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

    // Guard against missing teamId to prevent uploads to incorrect paths
    if (!user?.teamId) {
      toast({
        duration: 2500,
        variant: "error",
        title: "Unable to upload. Please try again.",
      });
      return;
    }

    // Set default progress
    uploadProgress.current = files.map(() => 0);

    setShowProgress(true);

    const path = [user.teamId, "inbox"];

    try {
      // First, create inbox items immediately for instant feedback
      const inboxItems = await Promise.all(
        files.map(async (file: File) => {
          // Use the same filename processing as resumableUpload
          const processedFilename = stripSpecialCharacters(file.name);
          const filePath = [...path, processedFilename];
          return createInboxItemMutation.mutateAsync({
            filename: processedFilename,
            mimetype: file.type,
            size: file.size,
            filePath,
          });
        }),
      );

      // Store inbox IDs for tracking via realtime
      const inboxIds = inboxItems
        .map((item) => item?.id)
        .filter((id): id is string => !!id);
      addPending(inboxIds);

      // Invalidate inbox queries to show new items immediately
      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.infiniteQueryKey(),
      });

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

      // Trigger the upload jobs through inbox pipeline
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
      setShowProgress(false);
      dismiss(toastId);
      setToastId(undefined);

      // Show persistent processing toast - will be updated by data-table when matches arrive
      const fileCount = files.length;
      toast({
        id: PROCESSING_TOAST_ID,
        title: `Processing ${fileCount} ${fileCount === 1 ? "receipt" : "receipts"}...`,
        description: "Looking for matching transactions",
        variant: "spinner",
        duration: Number.POSITIVE_INFINITY, // Persistent until updated
      });
    } catch (_error) {
      // Refresh inbox to show current state after error
      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.queryKey(),
      });

      setShowProgress(false);
      setToastId(undefined);
      dismiss(toastId);

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
          title: "File size too large.",
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
    noClick: true, // Don't open file dialog on click - only drag & drop
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div {...getRootProps()} className="relative h-full">
      <div className="absolute top-0 bottom-0 right-0 left-0 z-[51] pointer-events-none">
        <div
          className={cn(
            "bg-background h-full flex items-center justify-center text-center invisible",
            isDragActive && "visible",
          )}
        >
          <input {...getInputProps()} id="upload-transaction-files" />
          <p className="text-xs">
            Drop your receipts here. <br />
            They will be matched to transactions automatically.
            <br />
            <span className="text-[#878787]">
              Maximum of 25 files at a time.
            </span>
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
