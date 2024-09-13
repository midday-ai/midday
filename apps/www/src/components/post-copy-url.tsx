"use client";

import { useState } from "react";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";

export function PostCopyURL({ slug }) {
  const [isCopied, setCopied] = useState(false);
  const url = `https://solomon-ai.app${slug}`;

  const handleClipboard = async () => {
    try {
      setCopied(true);

      await navigator.clipboard.writeText(url);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={handleClipboard}
      className="relative flex items-center space-x-2"
    >
      <motion.div
        className="top-0.3 absolute -left-4"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: isCopied ? 0 : 1, scale: isCopied ? 0 : 1 }}
      >
        <Icons.Copy />
      </motion.div>

      <motion.div
        className="top-0.3 absolute -left-[24px]"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isCopied ? 1 : 0, scale: isCopied ? 1 : 0 }}
      >
        <Icons.Check />
      </motion.div>

      <span className="text-xs">Copy link</span>
    </button>
  );
}
