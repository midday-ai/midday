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
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
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
  fullPath: string;
};

export function ExportStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast, dismiss, update } = useToast();
  const [toastId, setToastId] = useState<string | null>(null);
  const { exportData, setExportData } = useExportStore();
  const [, copy] = useCopyToClipboard();

  const shareFileMutation = useMutation(
    trpc.shortLinks.createForFile.mutationOptions({
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

    setToastId(null);
    setExportData(undefined);
  };

  const handleOnShare = ({ expireIn, fullPath }: ShareOptions) => {
    shareFileMutation.mutate({ expireIn, fullPath });

    if (toastId) {
      dismiss(toastId);
    }
  };

  useEffect(() => {
    if (exportData?.status === "failed") {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });

      setToastId(null);
      setExportData(undefined);
    }
  }, [exportData]);

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
    } else if (
      toastId &&
      (exportData?.status === "active" || exportData?.status === "waiting")
    ) {
      update(toastId, {
        id: toastId,
        progress: Number(exportData?.progress),
      });
    }

    if (exportData?.status === "completed" && exportData?.result) {
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({
        queryKey: trpc.documents.get.infiniteQueryKey(),
      });

      // Invalidate search query to refresh the results
      queryClient.invalidateQueries({
        queryKey: trpc.search.global.queryKey(),
      });

      // @ts-expect-error
      update(toastId, {
        id: toastId,
        title: "Export completed",
        description: `Your export is ready based on ${exportData?.result?.totalItems} transactions. It's stored in your Vault.`,
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
                        fullPath: exportData?.result?.fullPath!,
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
                if (exportData?.result?.fullPath) {
                  const filename = exportData?.result?.fullPath
                    ?.split("/")
                    .at(-1);
                  downloadFile(
                    `/api/download/file?path=${exportData?.result?.fullPath}&filename=${filename}`,
                    filename ?? "export",
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
    }
  }, [toastId, exportData]);

  return null;
}
