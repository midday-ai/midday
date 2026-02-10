"use client";

import { useChat, useChatActions, useDataPart } from "@ai-sdk-tools/store";
import { Button } from "@midday/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { extractBankAccountRequired } from "@/lib/chat-utils";
import { useAudioPlayerStore } from "@/store/audio-player";

type SuggestionsData = {
  prompts: string[];
};

const delay = 0.05;

export function SuggestedPrompts() {
  const [suggestions, clearSuggestions] =
    useDataPart<SuggestionsData>("suggestions");
  const { sendMessage } = useChatActions();
  const { isChatPage } = useChatInterface();
  const { messages } = useChat();
  const { isAtBottom, scrollRef } = useStickToBottomContext();
  const isAudioPlayerVisible = useAudioPlayerStore((state) => state.isVisible);
  const [shouldShow, setShouldShow] = useState(true);
  const prevScrollTopRef = useRef<number>(0);
  const isAtBottomRef = useRef<boolean>(isAtBottom);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

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

  // Keep isAtBottom ref updated
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  // Track scroll direction - hide when scrolling up, show only when at bottom
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Initialize previous scroll position
    prevScrollTopRef.current = container.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const prevScrollTop = prevScrollTopRef.current;

      // Hide immediately when scrolling up (if not at bottom)
      if (currentScrollTop < prevScrollTop && !isAtBottomRef.current) {
        setShouldShow(false);
      }

      prevScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial state
    setShouldShow(isAtBottom);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRef, isAtBottom]);

  // Show only when at bottom
  useEffect(() => {
    if (isAtBottom) {
      setShouldShow(true);
    }
  }, [isAtBottom]);

  const prompts = suggestions?.prompts || [];

  // Track horizontal scroll state for shadows
  useEffect(() => {
    if (!shouldShow) return;

    const container = scrollableRef.current;
    if (!container) return;

    const checkScrollability = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const scrollable = scrollWidth > clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      setIsScrollable(scrollable);
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < maxScrollLeft - 1);
    };

    // Initial check with a small delay to ensure layout is complete
    requestAnimationFrame(checkScrollability);

    // Check on scroll
    container.addEventListener("scroll", checkScrollability, { passive: true });

    // Check on resize (handles layout changes)
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkScrollability);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollability);
      resizeObserver.disconnect();
    };
  }, [prompts, shouldShow]);

  // Hide follow-up questions when audio player is visible
  if (
    !suggestions?.prompts ||
    suggestions.prompts.length === 0 ||
    !isChatPage ||
    bankAccountRequired ||
    !shouldShow ||
    isAudioPlayerVisible
  ) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
        className="relative mb-2"
      >
        {isScrollable && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-20" />
        )}
        {isScrollable && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-20" />
        )}
        <div
          ref={scrollableRef}
          className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
