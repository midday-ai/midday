"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { motion } from "framer-motion";
import {
  MdChatBubbleOutline,
  MdContentCopy,
  MdOutlineFileDownload,
} from "react-icons/md";
import { InvoiceViewers } from "./invoice-viewers";

export type Customer = {
  name: string;
  website?: string;
};

type Props = {
  id: string;
  size: "letter" | "a4";
  customer: Customer;
  viewedAt?: string;
};

export default function InvoiceToolbar({
  id,
  size,
  customer,
  viewedAt,
}: Props) {
  const { setParams } = useInvoiceParams();

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  return (
    <motion.div
      className="fixed inset-x-0 -bottom-1 flex justify-center"
      initial={{ opacity: 0, filter: "blur(8px)", y: 0 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: -24 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 rounded-full pl-2 pr-4 py-3 h-10 flex items-center justify-center border-[0.5px] border-border">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={`/api/download/invoice?id=${id}&size=${size}`} download>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-8"
                >
                  <MdOutlineFileDownload className="size-[18px]" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="text-[10px] px-2 py-1 rounded-sm font-medium"
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
              className="text-[10px] px-2 py-1 rounded-sm font-medium"
            >
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8 relative"
                onClick={() => setParams({ type: "comments", invoiceId: id })}
              >
                <div className="rounded-full size-1 absolute bg-[#FFD02B] right-[3px] top-[3px] ring-2 ring-background">
                  <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[ping_1s_ease-in-out_5]" />
                  <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[pulse_1s_ease-in-out_5] opacity-75" />
                  <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[pulse_1s_ease-in-out_5] opacity-50" />
                </div>
                <MdChatBubbleOutline />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={15}
              className="text-[10px] px-2 py-1 rounded-sm font-medium"
            >
              <p>Comment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider> */}

        <InvoiceViewers customer={customer} viewedAt={viewedAt} />
      </div>
    </motion.div>
  );
}
