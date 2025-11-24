"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { extractBankAccountRequired } from "@/lib/chat-utils";
import { useChat, useChatActions, useDataPart } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useConversationScroll } from "./chat-interface";

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
  const scrollContainerRef = useConversationScroll();

  const { shouldShow, direction } = useScrollDirection(
    scrollContainerRef,
    {
      threshold: 1,
      throttle: 16,
      showAtBottom: true,
    },
    messages.length, // Re-run when messages change
  );

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        shouldShow
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: -10, pointerEvents: "none" }
      }
      transition={{
        duration: direction === "up" ? 0.15 : 0.3,
        ease: "easeOut",
      }}
      className="absolute bottom-full left-0 right-0 w-full z-30 flex gap-2 mb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </motion.div>
  );
}
