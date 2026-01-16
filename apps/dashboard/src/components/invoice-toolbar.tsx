"use client";

import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useEffect, useRef, useState } from "react";
import { MdContentCopy, MdOutlineFileDownload } from "react-icons/md";
import { useCopyToClipboard } from "usehooks-ts";
import { PaymentModal } from "./invoice/payment-modal";

type Props = {
  token: string;
  invoiceNumber: string;
  paymentEnabled?: boolean;
  amount?: number;
  currency?: string;
  status?: string;
  onPaymentSuccess?: () => void;
  portalEnabled?: boolean;
  portalId?: string | null;
  onPaymentOpenChange?: (open: boolean) => void;
  isPaymentOpen?: boolean;
  useOverlay?: boolean;
};

export default function InvoiceToolbar({
  token,
  invoiceNumber,
  paymentEnabled,
  amount,
  currency,
  status,
  onPaymentSuccess,
  portalEnabled,
  portalId,
  onPaymentOpenChange,
  isPaymentOpen,
  useOverlay,
}: Props) {
  const trpc = useTRPC();
  const [, copy] = useCopyToClipboard();
  const { toast } = useToast();
  const [internalPaymentOpen, setInternalPaymentOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(status === "paid");
  const [shouldPrefetch, setShouldPrefetch] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const paymentModalOpen = isPaymentOpen ?? internalPaymentOpen;
  const setPaymentModalOpen = onPaymentOpenChange ?? setInternalPaymentOpen;
  const paymentModalOpenRef = useRef(paymentModalOpen);

  // Fetch attachments for the invoice
  const { data: attachments = [] } = useQuery({
    ...trpc.invoiceAttachments.getByToken.queryOptions({ token }),
    enabled: !!token,
  });

  // Sync isPaid with status prop
  useEffect(() => {
    setIsPaid(status === "paid");
  }, [status]);

  // Keep ref in sync with state
  useEffect(() => {
    paymentModalOpenRef.current = paymentModalOpen;
  }, [paymentModalOpen]);

  const handleCopyLink = () => {
    const url = window.location.href;
    copy(url);
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const hasAttachments = attachments.length > 0;

      if (isPaid) {
        // For paid invoices, create a zip with invoice, receipt, and attachments
        const zip = new JSZip();

        // Fetch invoice (with attachments if any - server will include them)
        const invoiceUrl = hasAttachments
          ? `${apiUrl}/files/download/invoice?token=${token}&includeAttachments=true`
          : `${apiUrl}/files/download/invoice?token=${token}`;

        const invoiceResponse = await fetch(invoiceUrl);
        if (!invoiceResponse.ok) {
          throw new Error("Failed to fetch invoice");
        }

        // If there are attachments, the response is already a ZIP
        if (hasAttachments) {
          const invoiceZipBlob = await invoiceResponse.blob();
          // Extract files from the invoice ZIP and add to our combined ZIP
          const invoiceZip = await JSZip.loadAsync(invoiceZipBlob);
          for (const [filename, file] of Object.entries(invoiceZip.files)) {
            if (!file.dir) {
              const content = await file.async("blob");
              zip.file(filename, content);
            }
          }
        } else {
          const invoiceBlob = await invoiceResponse.blob();
          zip.file(`${invoiceNumber}.pdf`, invoiceBlob);
        }

        // Fetch receipt
        const receiptResponse = await fetch(
          `${apiUrl}/files/download/invoice?token=${token}&type=receipt`,
        );
        if (receiptResponse.ok) {
          const receiptBlob = await receiptResponse.blob();
          zip.file(`receipt-${invoiceNumber}.pdf`, receiptBlob);
        }

        // Generate and download zip
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
        });

        const zipName = hasAttachments
          ? `${invoiceNumber}-complete.zip`
          : `${invoiceNumber}-invoice-and-receipt.zip`;
        saveAs(zipBlob, zipName);
      } else if (hasAttachments) {
        // Unpaid invoice with attachments - use server-side ZIP
        const response = await fetch(
          `${apiUrl}/files/download/invoice?token=${token}&includeAttachments=true`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch invoice");
        }
        const blob = await response.blob();
        saveAs(blob, `${invoiceNumber}-with-attachments.zip`);
      } else {
        // Download invoice only (no attachments, not paid)
        await downloadFile(
          `${apiUrl}/files/download/invoice?token=${token}`,
          `${invoiceNumber}.pdf`,
        );
      }
    } catch (error) {
      toast({
        duration: 4000,
        title: "Download failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download files. Please try again.",
        variant: "error",
      });
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const handleTogglePayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentModalOpen(!paymentModalOpenRef.current);
  };

  // Show pay button only when invoice can be paid (not paid, canceled, or refunded)
  const canPay =
    paymentEnabled &&
    typeof amount === "number" &&
    amount > 0 &&
    !isPaid &&
    status !== "canceled" &&
    status !== "refunded";

  // Keep modal mounted while showing success screen
  const shouldRenderModal = canPay || (paymentSucceeded && paymentModalOpen);

  return (
    <>
      <motion.div
        className="fixed inset-x-0 -bottom-1 flex justify-center"
        initial={{ opacity: 0, filter: "blur(8px)", y: 0 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: -24 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          data-invoice-toolbar
          className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 rounded-full px-2 py-3 h-10 flex items-center justify-center border-[0.5px] border-border gap-1"
        >
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-8"
                  disabled={isDownloading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  {isDownloading ? (
                    <Spinner className="size-[18px]" />
                  ) : (
                    <MdOutlineFileDownload className="size-[18px]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={15}
                className="text-[10px] px-2 py-1 rounded-none font-medium"
              >
                <p>
                  {isPaid && attachments.length > 0
                    ? "Download all files"
                    : isPaid
                      ? "Download invoice & receipt"
                      : attachments.length > 0
                        ? "Download with attachments"
                        : "Download"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-8"
                  onClick={handleCopyLink}
                >
                  <MdContentCopy />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={15}
                className="text-[10px] px-2 py-1 rounded-none font-medium"
              >
                <p>Copy link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {portalEnabled && portalId && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-8"
                      asChild
                    >
                      <a href={`/p/${portalId}`}>
                        <Icons.Customers className="size-[18px]" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={15}
                    className="text-[10px] px-2 py-1 rounded-none font-medium"
                  >
                    <p>View customer portal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {canPay && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              {status === "draft" ? (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          size="sm"
                          className="rounded-full h-7 px-3 text-xs text-secondary"
                          disabled
                        >
                          Pay invoice
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={15}
                      className="text-[10px] px-2 py-1 rounded-none font-medium"
                    >
                      <p>Invoice must be sent first</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full h-7 px-3 text-xs text-secondary"
                  onClick={handleTogglePayment}
                  onMouseEnter={() => setShouldPrefetch(true)}
                >
                  Pay invoice
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {shouldRenderModal &&
        status !== "draft" &&
        typeof amount === "number" && (
          <PaymentModal
            open={paymentModalOpen}
            onOpenChange={(open) => {
              setPaymentModalOpen(open);
              // When modal closes after successful payment, update isPaid state
              if (!open && paymentSucceeded) {
                setIsPaid(true);
              }
            }}
            invoiceToken={token}
            amount={amount}
            currency={currency || "usd"}
            invoiceNumber={invoiceNumber}
            prefetch={shouldPrefetch}
            useOverlay={useOverlay}
            onSuccess={() => {
              // Mark payment as succeeded but don't set isPaid yet
              // (that happens when modal closes, to keep modal mounted)
              setPaymentSucceeded(true);
              onPaymentSuccess?.();
            }}
          />
        )}
    </>
  );
}
