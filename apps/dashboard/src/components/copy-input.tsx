"use client";

import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";

type Props = {
  value: string;
};

export function CopyInput({ value }: Props) {
  const [isCopied, setCopied] = useState(false);

  const handleClipboard = async () => {
    try {
      setCopied(true);

      await navigator.clipboard.writeText(value);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {}
  };

  return (
    <div className="flex items-center relative w-full rounded-md border border-input py-2 px-4">
      <div className="pr-7 text-[#878787] text-sm">inbox.23rwef@midday.ai</div>
      <button type="button" onClick={handleClipboard}>
        <motion.div
          className="absolute right-4 top-2.5"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: isCopied ? 0 : 1, scale: isCopied ? 0 : 1 }}
        >
          <Icons.Copy />
        </motion.div>

        <motion.div
          className="absolute right-4 top-2.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isCopied ? 1 : 0, scale: isCopied ? 1 : 0 }}
        >
          <Icons.Check />
        </motion.div>
      </button>
    </div>
  );
}
