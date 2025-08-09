"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/server";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type Props = {
  order: RouterOutputs["billing"]["orders"]["data"][number];
};

export function ActionsMenu({ order }: Props) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const [isDownloading, setIsDownloading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const downloadInvoiceMutation = useMutation(
    trpc.billing.getInvoice.mutationOptions({
      onSuccess: (result) => {
        if (result.downloadUrl) {
          const link = document.createElement("a");
          link.href = result.downloadUrl;
          link.download = `invoice-${order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setIsDownloading(false);
        setRetryCount(0);
      },
      onError: (error) => {
        // If invoice is not ready yet and we haven't exceeded retry limit, try again
        if (
          retryCount < 5 &&
          (error.message?.includes("invoice") ||
            error.message?.includes("generate") ||
            error.message?.includes("not found"))
        ) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => {
            downloadInvoiceMutation.mutate(order.id);
          }, 3000); // Wait 3 seconds between retries
        } else {
          toast({
            title: "Download failed",
            description: "Unable to download invoice. Please try again later.",
          });
          setIsDownloading(false);
          setRetryCount(0);
        }
      },
    }),
  );

  const handleDownload = useCallback(() => {
    setIsDownloading(true);
    setRetryCount(0);
    downloadInvoiceMutation.mutate(order.id);
  }, [downloadInvoiceMutation, order.id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
          {isDownloading
            ? retryCount > 0
              ? `Generating... (${retryCount}/5)`
              : "Preparing..."
            : "Download Invoice"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
