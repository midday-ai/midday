"use client";

import { downloadFile } from "@/lib/download";
import { Button } from "@midday/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
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
};

export default function InvoiceToolbar({
  token,
  invoiceNumber,
  paymentEnabled,
  amount,
  currency,
  status,
  onPaymentSuccess,
}: Props) {
  const [, copy] = useCopyToClipboard();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(status === "paid");

  const handleCopyLink = () => {
    const url = window.location.href;
    copy(url);
  };

  // Show pay button only when invoice can be paid (not paid, canceled, or refunded)
  const canPay =
    paymentEnabled &&
    typeof amount === "number" &&
    amount > 0 &&
    !isPaid &&
    status !== "canceled" &&
    status !== "refunded";

  return (
    <>
      <motion.div
        className="fixed inset-x-0 -bottom-1 flex justify-center"
        initial={{ opacity: 0, filter: "blur(8px)", y: 0 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: -24 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 rounded-full px-2 py-3 h-10 flex items-center justify-center border-[0.5px] border-border gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-8"
                  onClick={() => {
                    downloadFile(
                      `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${token}`,
                      `${invoiceNumber}.pdf`,
                    );
                  }}
                >
                  <MdOutlineFileDownload className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={15}
                className="text-[10px] px-2 py-1 rounded-none font-medium"
              >
                <p>Download</p>
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
                  onClick={() => setPaymentModalOpen(true)}
                >
                  Pay invoice
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {canPay && status !== "draft" && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          invoiceToken={token}
          amount={amount}
          currency={currency || "usd"}
          invoiceNumber={invoiceNumber}
          onSuccess={() => {
            setIsPaid(true);
            onPaymentSuccess?.();
          }}
        />
      )}
    </>
  );
}
