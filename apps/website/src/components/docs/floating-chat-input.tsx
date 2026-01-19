"use client";

import type { docsNavigation } from "@/lib/docs";
import { Icons } from "@midday/ui/icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useDocsChat } from "./docs-chat-provider";
import { DocsNavPanel } from "./docs-nav-panel";

type FloatingChatInputProps = {
  navigation: typeof docsNavigation;
};

export function FloatingChatInput({ navigation }: FloatingChatInputProps) {
  const { sendMessage, isChatOpen } = useDocsChat();
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Autofocus input when chat is active (including on initial load with ?chat=true)
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      // Small delay to ensure DOM is ready after hydration
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    // Keep focus after sending
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isExpanded = isFocused || input.trim() || isChatOpen || isNavOpen;

  return (
    <motion.div
      className="fixed left-0 z-50 px-4 md:px-6"
      initial={{ bottom: 24, right: 0 }}
      animate={{
        bottom: isExpanded ? 48 : 24,
        right: isChatOpen ? 520 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <motion.div
        className="mx-auto relative"
        initial={{ maxWidth: 400 }}
        animate={{
          maxWidth: isExpanded ? 672 : 400,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Docs navigation panel - positioned above input */}
        <DocsNavPanel
          navigation={navigation}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          triggerRef={menuButtonRef}
        />

        <form onSubmit={handleSubmit}>
          <motion.div
            className="relative bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg flex items-center"
            initial={{ height: 44 }}
            animate={{
              height: isExpanded ? 76 : 44,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Browse docs icon - animated hamburger to X */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsNavOpen(!isNavOpen)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              className="pl-4 pr-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isNavOpen ? "Close menu" : "Browse documentation"}
            >
              <div className="relative size-4 flex flex-col justify-center items-center">
                <motion.span
                  className="absolute w-3.5 h-[1.5px] bg-current"
                  animate={{
                    rotate: isNavOpen ? 45 : 0,
                    y: isNavOpen ? 0 : -3,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
                <motion.span
                  className="absolute w-3.5 h-[1.5px] bg-current"
                  animate={{
                    opacity: isNavOpen ? 0 : 1,
                    scaleX: isNavOpen ? 0 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
                <motion.span
                  className="absolute w-3.5 h-[1.5px] bg-current"
                  animate={{
                    rotate: isNavOpen ? -45 : 0,
                    y: isNavOpen ? 0 : 3,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask anything"
              className="flex-1 bg-transparent px-2 pr-12 text-sm outline-none placeholder:text-[rgba(102,102,102,0.5)]"
            />
            <motion.button
              type="submit"
              disabled={!input.trim()}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: isExpanded ? 1 : 0,
                scale: isExpanded ? 1 : 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              style={{
                pointerEvents: isExpanded ? "auto" : "none",
              }}
            >
              <Icons.ArrowUpward className="size-4" />
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}
