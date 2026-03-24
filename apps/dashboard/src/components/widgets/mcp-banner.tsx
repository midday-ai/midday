"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LocalStorageKeys } from "@/utils/constants";

export function McpBanner() {
  const [dismissed, setDismissed] = useLocalStorage(
    LocalStorageKeys.McpBannerDismissed,
    false,
  );

  return (
    <AnimatePresence>
      {!dismissed && (
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
          className="fixed bottom-4 right-6 z-50"
        >
          <div className="group relative border border-border bg-background shadow-lg w-[300px] overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDismissed(true);
              }}
              className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-primary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icons.Close size={14} />
            </button>

            <Link href="/apps?q=mcp" className="block">
              <div className="relative h-[100px] flex items-center justify-center border-b border-border">
                <div
                  className="absolute inset-0 dark:hidden"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div
                  className="absolute inset-0 hidden dark:block"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div className="relative w-[160px] h-[44px]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    className="absolute left-0 top-[4px] size-[36px] overflow-hidden z-[1]"
                  >
                    <PerplexityMcpLogo />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                    className="absolute left-[26px] top-[2px] size-[40px] overflow-hidden z-[2]"
                  >
                    <ClaudeMcpLogo />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                    className="absolute left-[56px] top-0 size-[44px] overflow-hidden z-[5]"
                  >
                    <CursorMcpLogo />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                    className="absolute left-[90px] top-[2px] size-[40px] overflow-hidden z-[4]"
                  >
                    <ChatGPTMcpLogo />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1, duration: 0.3 }}
                    className="absolute left-[120px] top-[4px] size-[36px] overflow-hidden z-[3]"
                  >
                    <CopilotMcpLogo />
                  </motion.div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium mb-1">
                  Midday works with your AI tools
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect Claude, Cursor, ChatGPT and more to your financial
                  data via MCP.
                </p>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
