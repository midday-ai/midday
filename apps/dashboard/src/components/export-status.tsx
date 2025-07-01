"use client";

import { useExportStatus } from "@/hooks/use-export-status";
import { downloadFile } from "@/lib/download";
import { useExportStore } from "@/store/export";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { addDays, addYears } from "date-fns";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

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

type ExportData = {
  runId?: string;
  accessToken?: string;
};

export function ExportStatus() {
  const trpc = useTRPC();
  const { toast, dismiss, update } = useToast();
  const [toastId, setToastId] = useState<string | null>(null);
  const { exportData, setExportData } = useExportStore();
  const { status, progress, result } = useExportStatus(
    exportData as ExportData,
  );
  const [, copy] = useCopyToClipboard();

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

  const handleOnDownload = () => {
    if (toastId) {
      dismiss(toastId);
    }
  };

  const handleOnShare = ({ expireIn, filePath }: ShareOptions) => {
    shareFileMutation.mutate({ expireIn, filePath });

    if (toastId) {
      dismiss(toastId);
    }
  };

  useEffect(() => {
    if (status === "FAILED") {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });

      setToastId(null);
      setExportData(undefined);
    }
  }, [status]);

  useEffect(() => {
    if (exportData && !toastId) {
      const { id } = toast({
        title: "Exporting transactions.",
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Number.POSITIVE_INFINITY,
        progress: 0,
      });

      setToastId(id);
    } else if (toastId && status === "IN_PROGRESS") {
      update(toastId, {
        id: toastId,
        progress: Number(progress),
      });
    }

    if (status === "COMPLETED" && result) {
      // @ts-expect-error
      update(toastId, {
        id: toastId,
        title: "Export completed",
        description: `Your export is ready based on ${result.totalItems} transactions. It's stored in your Vault.`,
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
                        filePath: result.fullPath,
                      })
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={() => {
                if (result?.fullPath && result?.fileName) {
                  downloadFile(
                    `/api/download/file?path=${result.fullPath}&filename=${result.fileName}`,
                    result.fileName,
                  );
                }
                handleOnDownload();
              }}
            >
              Download
            </Button>
          </div>
        ),
      });

      setToastId(null);
      setExportData(undefined);
    }
  }, [toastId, progress, status]);

  return null;
}
