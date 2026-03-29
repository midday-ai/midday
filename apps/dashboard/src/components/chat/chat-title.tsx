"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useChatState } from "@/components/chat/chat-context";

export function ChatTitle() {
  const { chatTitle } = useChatState();

  return (
    <AnimatePresence mode="wait">
      {chatTitle && (
        <motion.span
          key={chatTitle}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-sm text-primary truncate max-w-[300px] overflow-hidden whitespace-nowrap inline-block"
        >
          {chatTitle}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
