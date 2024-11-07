"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { useState } from "react";

type Props = {
  value: string;
  className?: string;
};

export function CopyInput({ value, className }: Props) {
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
    <button
      type="button"
      onClick={handleClipboard}
      className={cn(
        "flex items-center relative w-full border py-2 px-4 cursor-pointer",
        className,
      )}
    >
      <div className="pr-8 text-[#878787] text-sm truncate">{value}</div>

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
  );
}
