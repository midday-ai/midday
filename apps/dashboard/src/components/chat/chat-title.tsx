"use client";

import { useDataPart } from "@ai-sdk-tools/store";
import { AnimatePresence, motion } from "framer-motion";

interface ChatTitleData {
  chatId: string;
  title: string;
}

export function ChatTitle() {
  const [chatTitle] = useDataPart<ChatTitleData>("chat-title", {
    onData: (dataPart) => {
      if (dataPart.data.title) {
        document.title = `${dataPart.data.title} - AI SDK Tools`;
      }
    },
  });

  return (
    <AnimatePresence mode="wait">
      {chatTitle?.title && (
        <motion.div
          key={chatTitle.title}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="text-xs font-medium text-foreground whitespace-nowrap">
            {chatTitle.title}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
