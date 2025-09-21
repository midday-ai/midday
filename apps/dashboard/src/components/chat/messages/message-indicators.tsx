"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { motion } from "framer-motion";
import { useState } from "react";

export function MessageActions() {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const onRetry = () => {
    console.log("Retry clicked");
  };

  const onThumbsUp = () => {
    console.log("Thumbs up clicked");
  };

  const onThumbsDown = () => {
    console.log("Thumbs down clicked");
  };

  const copyToClipboard = async () => {
    // try {
    //   await navigator.clipboard.writeText(messageContent);
    // } catch (err) {
    //   console.error("Failed to copy to clipboard:", err);
    // }
  };

  return (
    <motion.div
      className="flex items-center gap-1 mt-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.05,
      }}
    >
      {/* Copy Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                <Icons.Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Copy response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Retry Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                <Icons.Refresh className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Retry response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Thumbs Up Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onThumbsUp}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                <Icons.ThumbUp className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Thumbs up</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Thumbs Down Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onThumbsDown}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                <Icons.ThumbDown className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Thumbs down</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Info Button with Tooltip */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted rounded-sm"
              >
                <Icons.InfoOutline className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Data source info</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Custom Info Tooltip */}
        {showInfoTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap z-50 rounded-md shadow-md">
            Data from bank APIs, accounting software, and business tools via
            secure connections
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
