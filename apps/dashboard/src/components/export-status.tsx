"use client";

import { useExportStore } from "@/store/export";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useEventRunStatuses } from "@trigger.dev/react";
import { useEffect, useState } from "react";

export function ExportStatus() {
  const { toast, dismiss, update } = useToast();
  const [toastId, setToastId] = useState(null);
  const { exportId, setExportId } = useExportStore();
  const { error, statuses } = useEventRunStatuses(exportId);
  const status = statuses?.at(0);

  const handleOnDownload = (id: string) => {
    console.log("download");
    dismiss(id);
  };

  const handleOnShare = (id: string) => {
    dismiss(id);
  };

  useEffect(() => {
    if (exportId && !toastId) {
      const { id } = toast({
        title: "Exporting transactions.",
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Infinity,
        progress: 0,
      });

      setToastId(id);
    } else {
      update(toastId, {
        progress: status?.data?.progress,
      });
    }

    if (status?.data?.progress === 100) {
      const { id } = toast({
        title: "Export completed",
        description: `Your export is ready based on ${status?.data?.totalItems} transactions.`,
        duration: Infinity,
        footer: (
          <div className="mt-4 flex space-x-4">
            <Button
              size="sm"
              variant="secondary"
              className="border"
              onClick={() => handleOnShare(id)}
            >
              Get URL
            </Button>
            <Button size="sm" onClick={() => handleOnDownload(id)}>
              Download
            </Button>
          </div>
        ),
      });

      setToastId(null);
      setExportId(undefined);
    }
  }, [exportId, toastId, status]);

  useEffect(() => {
    if (error) {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });

      setToastId(null);
      setExportId(undefined);
    }
  }, [error]);

  return null;
}
