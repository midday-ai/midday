"use client";

import { shareFileAction } from "@/actions/share-file-action";
import { useExportStatus } from "@/hooks/use-export-status";
import { useExportStore } from "@/store/export";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import ms from "ms";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

const options = [
  {
    label: "Expire in 1 week",
    expireIn: ms("7d"),
  },
  {
    label: "Expire in 1 month",
    expireIn: ms("30d"),
  },
  {
    label: "Expire in 1 year",
    expireIn: ms("1y"),
  },
];

export function ExportStatus() {
  const { toast, dismiss, update } = useToast();
  const [toastId, setToastId] = useState(null);
  const { exportData, setExportData } = useExportStore();
  const { status, progress, result } = useExportStatus(exportData);

  const shareFile = useAction(shareFileAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
    onSuccess: async ({ data }) => {
      await navigator.clipboard.writeText(data ?? "");

      toast({
        duration: 2500,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    },
  });

  const handleOnDownload = () => {
    dismiss(toastId);
  };

  const handleOnShare = ({ expireIn, filename }) => {
    shareFile.execute({ expireIn, filepath: `exports/${filename}` });
    dismiss(toastId);
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
    } else {
      update(toastId, {
        progress,
      });
    }

    if (status === "COMPLETED" && result) {
      update(toastId, {
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
                        filename: result.fileName,
                      })
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href={`/api/download/file?path=exports/${result.fileName}&filename=${result.fileName}`}
              download
            >
              <Button size="sm" onClick={handleOnDownload}>
                Download
              </Button>
            </a>
          </div>
        ),
      });

      setToastId(null);
      setExportData(undefined);
    }
  }, [toastId, progress, status]);

  return null;
}
