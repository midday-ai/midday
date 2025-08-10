"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

type Props = {
  order: RouterOutputs["billing"]["orders"]["data"][number];
};

export function ActionsMenu({ order }: Props) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentToast, setCurrentToast] = useState<{
    id: string;
    dismiss: () => void;
    update: (props: any) => void;
  } | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  // Use React Query for polling invoice status
  const { data: invoiceStatus, error: invoiceError } = useQuery({
    ...trpc.billing.checkInvoiceStatus.queryOptions(order.id),
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 2000 : false, // Poll every 2 seconds when enabled
    refetchIntervalInBackground: false,
  });

  // Handle invoice status changes
  useEffect(() => {
    if (!shouldPoll || !invoiceStatus) return;

    if (invoiceStatus.status === "ready" && invoiceStatus.downloadUrl) {
      // Stop polling
      setShouldPoll(false);

      // Dismiss the generating toast
      if (currentToast) {
        currentToast.dismiss();
      }

      // Download the file
      const link = document.createElement("a");
      link.href = invoiceStatus.downloadUrl;
      link.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
      setCurrentToast(null);
      setProgress(0);
      setPollCount(0);
    } else if (invoiceStatus.status === "generating" && currentToast) {
      // Increment poll count for progress simulation
      setPollCount((prev) => prev + 1);

      // Simulate progress - gradually increase from 10% to 90% over time
      const newProgress = Math.min(90, 10 + pollCount * 8);
      setProgress(newProgress);

      // Update existing toast with current status and progress
      currentToast.update({
        title: "Generating invoice...",
        description: `Processing your invoice (${Math.round(newProgress)}% complete)`,
        duration: Number.POSITIVE_INFINITY,
        variant: "progress",
        progress: newProgress,
      });
    }
  }, [invoiceStatus, shouldPoll, order.id, toast, pollCount]);

  // Handle invoice status errors
  useEffect(() => {
    if (invoiceError && shouldPoll) {
      setShouldPoll(false);

      // Update existing toast with error
      if (currentToast) {
        currentToast.update({
          title: "Generation failed",
          description: "Unable to generate invoice. Please try again later.",
          variant: "error",
          duration: 5000,
        });
      }

      setIsDownloading(false);
      setCurrentToast(null);
      setProgress(0);
      setPollCount(0);
    }
  }, [invoiceError, shouldPoll, currentToast]);

  // Stop polling after 2 minutes
  useEffect(() => {
    if (shouldPoll) {
      const timeout = setTimeout(() => {
        setShouldPoll(false);
        if (currentToast) {
          currentToast.update({
            title: "Generation timeout",
            description:
              "Invoice generation is taking longer than expected. Please try again later.",
            variant: "error",
            duration: 5000,
          });
          setIsDownloading(false);
          setCurrentToast(null);
          setProgress(0);
          setPollCount(0);
        }
      }, 120000); // 2 minutes

      return () => clearTimeout(timeout);
    }
  }, [shouldPoll, currentToast]);

  const downloadInvoiceMutation = useMutation(
    trpc.billing.getInvoice.mutationOptions({
      onSuccess: (result) => {
        if (result.status === "ready" && result.downloadUrl) {
          // Download immediately if ready
          const link = document.createElement("a");
          link.href = result.downloadUrl;
          link.download = `invoice-${order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setIsDownloading(false);
        } else if (result.status === "generating") {
          // Start polling for status
          setProgress(10); // Start with 10% progress
          setPollCount(0);

          const toastInstance = toast({
            title: "Generating invoice...",
            description: "This may take a few moments",
            duration: Number.POSITIVE_INFINITY,
            variant: "progress",
            progress: 10,
          });

          setCurrentToast(toastInstance);
          setShouldPoll(true);
        }
      },
      onError: (error) => {
        toast({
          title: "Download failed",
          description: "Unable to download invoice. Please try again later.",
          variant: "error",
        });
        setIsDownloading(false);
        setCurrentToast(null);
        setProgress(0);
        setPollCount(0);
      },
    }),
  );

  const handleDownload = useCallback(() => {
    setIsDownloading(true);
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
          {isDownloading ? "Preparing..." : "Download Invoice"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
