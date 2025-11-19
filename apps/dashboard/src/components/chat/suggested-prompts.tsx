"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { extractBankAccountRequired } from "@/lib/chat-utils";
import { useChat, useChatActions, useDataPart } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import type { UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";

type SuggestionsData = {
  prompts: string[];
};

const delay = 1;

export function SuggestedPrompts() {
  const [suggestions, clearSuggestions] =
    useDataPart<SuggestionsData>("suggestions");
  const { sendMessage } = useChatActions();
  const { isChatPage } = useChatInterface();
  const { messages } = useChat();

  // Check if last message requires bank account
  const lastMessage = messages[messages.length - 1];
  const bankAccountRequired =
    lastMessage?.role === "assistant"
      ? extractBankAccountRequired(lastMessage.parts)
      : false;

  const handlePromptClick = (prompt: string) => {
    clearSuggestions();
    sendMessage({ text: prompt });
  };

  if (
    !suggestions?.prompts ||
    suggestions.prompts.length === 0 ||
    !isChatPage ||
    bankAccountRequired
  ) {
    return null;
  }

  const prompts = suggestions.prompts;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
        className="absolute bottom-full left-0 right-0 w-full z-30 flex gap-2 mb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {prompts.map((prompt, index) => (
          <motion.div
            key={prompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.2,
              delay: delay + index * 0.05,
              ease: "easeOut",
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePromptClick(prompt)}
              className="px-2 py-1 h-auto rounded-full text-xs font-normal border text-[#666] flex-shrink-0 whitespace-nowrap bg-background"
            >
              {prompt}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
