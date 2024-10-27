"use client";

import { Button } from "@midday/ui/button";
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
  customer: Customer;
};

export default function InvoiceToolbar({ customer }: Props) {
  return (
    <motion.div
      className="fixed inset-x-0 bottom-2 flex justify-center"
      initial={{ opacity: 0, filter: "blur(8px)", y: 0 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: -24 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 rounded-full px-4 py-3 h-10 flex items-center justify-center">
        <Button variant="ghost" size="icon" className="rounded-full size-8">
          <MdOutlineFileDownload className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full size-8">
          <MdContentCopy />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-8 relative"
        >
          <div className="rounded-full size-1 absolute bg-[#FFD02B] right-[3px] top-[3px] ring-2 ring-background">
            <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[ping_1s_ease-in-out_5]" />
            <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[pulse_1s_ease-in-out_5] opacity-75" />
            <div className="absolute inset-0 rounded-full bg-[#FFD02B] animate-[pulse_1s_ease-in-out_5] opacity-50" />
          </div>
          <MdChatBubbleOutline />
        </Button>

        <InvoiceViewers customer={customer} />
      </div>
    </motion.div>
  );
}
