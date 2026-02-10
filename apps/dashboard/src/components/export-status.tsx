"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, addYears } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { useFileUrl } from "@/hooks/use-file-url";
import { useJobStatus } from "@/hooks/use-job-status";
import { useSuccessSound } from "@/hooks/use-success-sound";
import { downloadFile } from "@/lib/download";
import { useExportStore } from "@/store/export";
import { useTRPC } from "@/trpc/client";

const options = [
  {
    label: "Expire in 1 week",
    expireIn: Math.floor(addDays(new Date(), 7).getTime() / 1000),
  },
  {
    label: "Expire in 1 month",
    expireIn: Math.floor(addDays(new Date(), 30).getTime() / 1000),
  },
  {
    label: "Expire in 1 year",
    expireIn: Math.floor(addYears(new Date(), 1).getTime() / 1000),
  },
] as const;

type ShareOptions = {
  expireIn: number;
  filePath: string;
};

type ExportResult = {
  filePath: string;
  fullPath: string;
  fileName: string;
  totalItems: number;
};

function DownloadButton({
  fullPath,
  fileName,
  onDownload,
}: {
  fullPath: string;
  fileName: string;
  onDownload: () => void;
}) {
  const { url: authenticatedUrl } = useFileUrl({
    type: "download",
    filePath: fullPath,
    filename: fileName,
  });

  return (
    <Button
      size="sm"
      onClick={() => {
        if (authenticatedUrl && fileName) {
          downloadFile(authenticatedUrl, fileName);
        }
        onDownload();
      }}
      disabled={!authenticatedUrl}
    >
      Download
    </Button>
  );
}

export function ExportStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast, dismiss, update } = useToast();
  const { play: playSuccessSound } = useSuccessSound();
  const [toastId, setToastId] = useState<string | null>(null);
  const { exportData, setExportData } = useExportStore();
  const { status, progress, result, isLoading, queryError } = useJobStatus({
    jobId: exportData?.runId,
    enabled: !!exportData?.runId,
  });

  const [, copy] = useCopyToClipboard();

  // Type guard for export result
  const exportResult: ExportResult | undefined =
    result && typeof result === "object" && "totalItems" in result
      ? (result as ExportResult)
      : undefined;

  const shareFileMutation = useMutation(
    trpc.shortLinks.createForDocument.mutationOptions({
      onError: () => {
        toast({
          duration: 2500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
      onSuccess: ({ shortUrl }) => {
        copy(shortUrl ?? "");

        toast({
          duration: 2500,
          title: "Copied URL to clipboard.",
          variant: "success",
        });
      },
    }),
  );

  const handleOnDownload = useCallback(() => {
    if (toastId) {
      dismiss(toastId);
    }
  }, [toastId, dismiss]);

  const handleOnShare = useCallback(
    ({ expireIn, filePath }: ShareOptions) => {
      shareFileMutation.mutate({ expireIn, filePath });

      if (toastId) {
        dismiss(toastId);
      }
    },
    [toastId, dismiss, shareFileMutation],
  );

  // Track last progress to avoid unnecessary updates
  const lastProgressRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Skip error handling for accounting exports - the export bar handles those
    if (exportData?.exportType === "accounting") {
      return;
    }

    if (status === "failed" || queryError) {
      // Dismiss the progress toast if it exists
      if (toastId) {
        dismiss(toastId);
      }

      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });

      setToastId(null);
      setExportData(undefined);
    }
  }, [
    status,
    queryError,
    toast,
    setExportData,
    toastId,
    dismiss,
    exportData?.exportType,
  ]);

  // Create toast when export starts (only for file exports - accounting uses the export bar)
  useEffect(() => {
    if (exportData?.runId && !toastId) {
      // Skip toast for accounting exports - the export bar handles those
      if (exportData.exportType === "accounting") {
        return;
      }

      const { id } = toast({
        title: "Exporting transactions.",
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Number.POSITIVE_INFINITY,
        progress: 0,
      });

      setToastId(id);
      lastProgressRef.current = 0;
      completionHandledRef.current = false; // Reset completion flag for new export
    }
  }, [exportData?.runId, exportData?.exportType, toastId, toast]);

  // Update progress only when it changes (skip for accounting exports)
  useEffect(() => {
    if (!toastId || exportData?.exportType === "accounting") return;

    const currentProgress =
      status === "completed"
        ? 100
        : progress !== undefined
          ? Number(progress)
          : undefined;

    if (
      currentProgress !== undefined &&
      currentProgress !== lastProgressRef.current &&
      (status === "active" || status === "waiting" || status === "completed")
    ) {
      lastProgressRef.current = currentProgress;
      update(toastId, {
        id: toastId,
        progress: currentProgress,
      });
    }
  }, [toastId, status, progress, update, exportData?.exportType]);

  // Handle completion separately - use a ref to prevent multiple triggers
  const completionHandledRef = useRef(false);

  // Handle file export completion (accounting exports are handled by export bar)
  useEffect(() => {
    // Skip completion handling for accounting exports
    if (exportData?.exportType === "accounting") {
      return;
    }

    if (status === "completed" && toastId && !completionHandledRef.current) {
      completionHandledRef.current = true;

      // Play success sound
      playSuccessSound();

      // Invalidate queries for file exports
      queryClient.invalidateQueries({
        queryKey: trpc.documents.get.infiniteQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.search.global.queryKey(),
      });

      // Wait a bit for result to be available, then update toast
      setTimeout(() => {
        if (exportResult) {
          // File export completion with download/share options
          update(toastId, {
            id: toastId,
            title: "Export completed",
            description: `Your export is ready based on ${exportResult.totalItems} transactions. It's stored in your Vault.`,
            variant: "success",
            footer: (
              <div className="mt-4 flex space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border space-x-2"
                    >
                      <span>Share URL</span>
                      <Icons.ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-[100]">
                    {options.map((option, idx) => (
                      <DropdownMenuItem
                        key={idx.toString()}
                        onClick={() =>
                          handleOnShare({
                            expireIn: option.expireIn,
                            filePath: exportResult.fullPath,
                          })
                        }
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DownloadButton
                  fullPath={exportResult.fullPath}
                  fileName={exportResult.fileName}
                  onDownload={handleOnDownload}
                />
              </div>
            ),
          });
        } else {
          // Simple completion toast if result isn't available
          update(toastId, {
            id: toastId,
            title: "Export completed",
            description: "Your export is ready. It's stored in your Vault.",
            variant: "success",
          });
        }

        // Clear after showing completion
        setTimeout(() => {
          setToastId(null);
          setExportData(undefined);
          completionHandledRef.current = false;
        }, 100);
      }, 500);
    }
  }, [
    status,
    exportResult,
    exportData?.exportType,
    toastId,
    update,
    queryClient,
    trpc,
    setExportData,
    handleOnShare,
    handleOnDownload,
    playSuccessSound,
  ]);

  return null;
}
