"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  ManusMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LocalStorageKeys } from "@/utils/constants";

export function McpBanner() {
  const [dismissed, setDismissed] = useLocalStorage(
    LocalStorageKeys.McpBannerDismissed,
    false,
  );
  const [mounted, setMounted] = useState(false);
  const [, setParams] = useQueryStates({
    "mcp-app": parseAsString,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AnimatePresence>
      {mounted && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            delay: 0.5,
          }}
          className="fixed bottom-2.5 right-4 z-50"
        >
          <div className="group relative border border-border bg-background shadow-lg w-[300px] overflow-hidden">
            <button
              type="button"
              data-track="MCP Banner Dismissed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDismissed(true);
              }}
              className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-primary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icons.Close size={14} />
            </button>

            <div className="relative h-[100px] flex items-center justify-center border-b border-border">
              <div
                className="absolute inset-0 dark:hidden pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              />
              <div
                className="absolute inset-0 hidden dark:block pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              />
              <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <button
                    type="button"
                    data-track="MCP App Selected"
                    data-app="chatgpt"
                    onClick={() => setParams({ "mcp-app": "chatgpt-mcp" })}
                    className="block size-9 overflow-hidden rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  >
                    <ChatGPTMcpLogo />
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  <button
                    type="button"
                    data-track="MCP App Selected"
                    data-app="claude"
                    onClick={() => setParams({ "mcp-app": "claude-mcp" })}
                    className="block size-9 overflow-hidden rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  >
                    <ClaudeMcpLogo />
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  <button
                    type="button"
                    data-track="MCP App Selected"
                    data-app="manus"
                    onClick={() => setParams({ "mcp-app": "manus-mcp" })}
                    className="block size-9 overflow-hidden rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  >
                    <ManusMcpLogo />
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.3 }}
                >
                  <button
                    type="button"
                    data-track="MCP App Selected"
                    data-app="perplexity"
                    onClick={() => setParams({ "mcp-app": "perplexity-mcp" })}
                    className="block size-9 overflow-hidden rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  >
                    <PerplexityMcpLogo />
                  </button>
                </motion.div>
              </div>
            </div>

            <Link href="/apps?q=mcp" className="block p-4">
              <h3 className="text-sm font-medium mb-1">
                Use Midday where you already work
              </h3>
              <p className="text-xs text-muted-foreground">
                Ask questions and take action without leaving your favorite AI
                tool.
              </p>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
