"use client";

import {
  useChatActions,
  useChatId,
  useChatStatus,
  useDataPart,
} from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/chat/audio-player";
import {
  ChatHistoryButton,
  ChatHistoryDropdown,
  ChatHistoryProvider,
  useChatHistoryContext,
} from "@/components/chat/chat-history";
import { CommandMenu } from "@/components/chat/command-menu";
import { RecordButton } from "@/components/chat/record-button";
import { SuggestedActionsButton } from "@/components/suggested-actions-button";
import { WebSearchButton } from "@/components/web-search-button";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useOverviewTab } from "@/hooks/use-overview-tab";
import { useWindowScroll } from "@/hooks/use-window-scroll";
import { useChatStore } from "@/store/chat";

export interface ChatInputMessage extends PromptInputMessage {
  metadata?: {
    agentChoice?: string;
    toolChoice?: string;
  };
}

function ChatInputContent() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isInteractingWithButtons, setIsInteractingWithButtons] =
    useState(false);
  const isTypingRef = useRef(false);
  const prevInputRef = useRef("");
  const textReveal = useMotionValue(100);
  const textOpacity = useMotionValue(1);
  const status = useChatStatus();
  const { sendMessage, stop } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { isMetricsTab } = useOverviewTab();
  const { scrollY } = useWindowScroll();
  const { isOpen: isHistoryOpen, setIsOpen: setHistoryOpen } =
    useChatHistoryContext();

  const [, clearSuggestions] = useDataPart<{ prompts: string[] }>(
    "suggestions",
  );

  const {
    input,
    isWebSearch,
    isUploading,
    isRecording,
    isProcessing,
    showCommands,
    selectedCommandIndex,
    filteredCommands,
    setInput,
    setShowCommands,
    handleInputChange,
    handleKeyDown,
    resetCommandState,
  } = useChatStore();

  // Ensure only one of history or commands is open at a time
  const prevShowCommands = useRef(showCommands);
  const prevHistoryOpen = useRef(isHistoryOpen);

  useEffect(() => {
    // Commands just opened - close history
    if (showCommands && !prevShowCommands.current && isHistoryOpen) {
      setHistoryOpen(false);
    }
    // History just opened - close commands
    if (isHistoryOpen && !prevHistoryOpen.current && showCommands) {
      setShowCommands(false);
    }

    prevShowCommands.current = showCommands;
    prevHistoryOpen.current = isHistoryOpen;
  }, [showCommands, isHistoryOpen, setHistoryOpen, setShowCommands]);

  // Calculate minimization factor based on scroll position (0-400px range)
  // Factor is 0 (full size) to 1 (minimized)
  const MAX_SCROLL = 400;
  const baseMinimizationFactor = isMetricsTab
    ? Math.max(0, Math.min(1, scrollY / MAX_SCROLL))
    : 0;

  // Override to full size (factor = 0) when:
  // - Input is focused
  // - Commands are shown
  // - History is open
  // - Buttons are being interacted with
  // - Input has content
  const shouldPreventMinimization =
    isFocused ||
    showCommands ||
    isHistoryOpen ||
    isInteractingWithButtons ||
    input.trim();

  const targetMinimizationFactor = shouldPreventMinimization
    ? 0
    : baseMinimizationFactor;

  // Motion value for minimization factor
  const minimizationFactor = useMotionValue(targetMinimizationFactor);

  // Track previous focus state to detect focus changes
  const prevShouldPreventMinimization = useRef(shouldPreventMinimization);

  // Update minimization factor:
  // - Animate smoothly when focus state changes
  // - Update immediately when scroll changes
  useEffect(() => {
    const focusStateChanged =
      prevShouldPreventMinimization.current !== shouldPreventMinimization;
    prevShouldPreventMinimization.current = shouldPreventMinimization;

    if (focusStateChanged) {
      // Animate smoothly when focus/blur
      animate(minimizationFactor, targetMinimizationFactor, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    } else {
      // Update immediately for scroll
      minimizationFactor.set(targetMinimizationFactor);
    }
  }, [targetMinimizationFactor, shouldPreventMinimization, minimizationFactor]);

  // Transform reveal value to clipPath
  const textClipPath = useTransform(
    textReveal,
    (value) => `inset(0 ${100 - value}% 0 0)`,
  );

  // Reveal animation when text is added externally (not by typing)
  useEffect(() => {
    // Only animate if input changed and it wasn't from typing
    const wasExternalChange =
      input !== prevInputRef.current && !isTypingRef.current && input;

    if (wasExternalChange) {
      // Set initial state - start hidden
      textReveal.set(0);
      textOpacity.set(0);

      // Use requestAnimationFrame to ensure the initial state is painted
      requestAnimationFrame(() => {
        animate(textReveal, 100, {
          duration: 0.7,
          ease: [0.25, 0.1, 0.25, 1], // smooth cubic-bezier
        });
        animate(textOpacity, 1, {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        });
      });
    }

    prevInputRef.current = input;
    isTypingRef.current = false;
  }, [input, textReveal, textOpacity]);

  // Transform motion value to actual style values - all smoothly interpolated
  const containerMaxWidth = useTransform(
    minimizationFactor,
    (factor) => `${770 - factor * (770 - 400)}px`,
  );

  // Container padding - keep constant, don't animate
  const containerPadding = 0;

  // Button animations - fade out early (by factor 0.4)
  const buttonOpacity = useTransform(minimizationFactor, (factor) => {
    // Fade out completely by factor 0.4
    if (factor >= 0.4) return 0;
    return 1 - factor / 0.4;
  });
  const buttonScale = useTransform(minimizationFactor, (factor) => {
    // Subtle scale from 1 to 0.95
    return 1 - factor * 0.05;
  });
  const buttonPointerEvents = useTransform(minimizationFactor, (factor) =>
    factor > 0.1 ? "none" : "auto",
  );

  // Toolbar wrapper - simple linear collapse
  const toolbarMaxHeight = useTransform(minimizationFactor, (factor) => {
    // Collapse from 56px (content + padding) to 0
    return 56 * (1 - factor);
  });
  const toolbarOpacity = useTransform(minimizationFactor, (factor) => {
    // Fade out completely by factor 0.4
    if (factor >= 0.4) return 0;
    return 1 - factor / 0.4;
  });

  // Body layout - smoothly interpolate gap and flex properties
  const bodyGap = useTransform(
    minimizationFactor,
    (factor) => 12 - factor * 12, // From 12px to 0px
  );
  const bodyPaddingRight = useTransform(
    minimizationFactor,
    (factor) => 0 + factor * 8, // From 0px to 8px
  );

  // Layout direction - use a lower threshold (0.15) for smoother transition
  const containerFlexDirection = useTransform(minimizationFactor, (factor) =>
    factor > 0.15 ? "row" : "column",
  );
  const bodyFlexDirection = useTransform(minimizationFactor, (factor) =>
    factor > 0.15 ? "row" : "column",
  );
  // Height animation - expanded (55px) vs minimized (52px)
  const inputWrapperHeight = useTransform(minimizationFactor, (factor) => {
    // Expanded: 55px, Minimized: 52px
    return 55 - factor * (55 - 52);
  });

  // Padding bottom - less when expanded, more when minimized
  const inputPaddingBottom = useTransform(minimizationFactor, (factor) => {
    // Expanded: 4px, Minimized: 10px
    return 4 + factor * 6;
  });

  const handleSubmit = (message: ChatInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // If currently streaming, stop the current stream first
    if (status === "streaming" || status === "submitted") {
      stop?.();
      // Continue to send the new message after stopping
    }

    // Clear old suggestions before sending new message
    clearSuggestions();

    // Set chat ID to ensure proper URL routing
    if (chatId) {
      setChatId(chatId);
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
      metadata: {
        agentChoice: message.metadata?.agentChoice,
        toolChoice: message.metadata?.toolChoice,
      },
    });
    setInput("");
    resetCommandState();
  };

  const handleStopClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent form submission when stopping
    e.preventDefault();
    e.stopPropagation();

    if (status === "streaming" || status === "submitted") {
      stop?.();
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="mx-auto w-full max-w-full relative"
      style={{
        maxWidth: containerMaxWidth,
      }}
    >
      <CommandMenu />
      <ChatHistoryDropdown />

      {/* Overlay to capture clicks when minimized */}
      {targetMinimizationFactor > 0.1 && (
        <div
          className="absolute inset-0 z-10 cursor-text"
          onClick={() => textareaRef.current?.focus()}
        />
      )}

      <motion.div
        style={{
          padding: containerPadding,
          flexDirection: containerFlexDirection,
        }}
        className="!bg-[rgba(247,247,247,0.85)] dark:!bg-[rgba(19,19,19,0.7)] backdrop-blur-lg flex relative"
      >
        <AudioPlayer />
        <PromptInput
          onSubmit={handleSubmit}
          globalDrop
          multiple
          accept="application/pdf,image/*"
          className="!bg-transparent w-full"
        >
          <motion.div
            style={{
              gap: bodyGap,
              paddingRight: bodyPaddingRight,
              display: "flex",
              width: "100%",
              flexDirection: bodyFlexDirection,
            }}
          >
            <PromptInputBody
              className={cn(
                targetMinimizationFactor > 0.15 && "flex-row flex-1 pr-2",
              )}
            >
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <motion.div
                style={{
                  height: inputWrapperHeight,
                  paddingBottom: inputPaddingBottom,
                  overflow: "hidden",
                  boxSizing: "border-box",
                  clipPath: textClipPath,
                  opacity: textOpacity,
                }}
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  onChange={(e) => {
                    isTypingRef.current = true;
                    handleInputChange(e);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-full border-none bg-transparent resize-none outline-none whitespace-nowrap overflow-hidden text-ellipsis"
                  onKeyDown={(e) => {
                    // Handle Enter key for commands
                    if (e.key === "Enter" && showCommands) {
                      e.preventDefault();
                      const selectedCommand =
                        filteredCommands[selectedCommandIndex];
                      if (selectedCommand) {
                        // Execute command through the store
                        if (!chatId) return;

                        // Clear old suggestions before sending new message
                        clearSuggestions();

                        setChatId(chatId);

                        sendMessage({
                          role: "user",
                          parts: [
                            { type: "text", text: selectedCommand.title },
                          ],
                          metadata: {
                            toolCall: {
                              toolName: selectedCommand.toolName,
                              toolParams: selectedCommand.toolParams,
                            },
                          },
                        });

                        setInput("");
                        resetCommandState();
                      }
                      return;
                    }

                    // Handle Enter key for normal messages - trigger form submission
                    if (e.key === "Enter" && !showCommands && !e.shiftKey) {
                      // Don't submit if IME composition is in progress
                      if (e.nativeEvent.isComposing) {
                        return;
                      }

                      e.preventDefault();
                      const form = e.currentTarget.form;
                      if (form) {
                        form.requestSubmit();
                      }
                      return;
                    }

                    // Handle other keys normally
                    handleKeyDown(e);
                  }}
                  value={input}
                  placeholder={isWebSearch ? "Search the web" : "Ask anything"}
                />
              </motion.div>
            </PromptInputBody>
          </motion.div>
          <motion.div
            style={{
              maxHeight: toolbarMaxHeight,
              opacity: toolbarOpacity,
              overflow: "hidden",
            }}
          >
            <PromptInputToolbar
              className={cn(targetMinimizationFactor > 0.15 && "flex-shrink-0")}
              onMouseDown={() => setIsInteractingWithButtons(true)}
              onMouseUp={() => {
                // Delay to allow button click to complete
                setTimeout(() => setIsInteractingWithButtons(false), 100);
              }}
              onFocus={() => setIsInteractingWithButtons(true)}
              onBlur={() => {
                // Delay to allow button click to complete
                setTimeout(() => setIsInteractingWithButtons(false), 100);
              }}
            >
              <PromptInputTools>
                <motion.div
                  className="flex items-center gap-2"
                  style={{
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    pointerEvents: buttonPointerEvents,
                  }}
                >
                  <PromptInputActionAddAttachments />
                  <SuggestedActionsButton />
                  <WebSearchButton />
                  <ChatHistoryButton />
                </motion.div>
              </PromptInputTools>

              <PromptInputTools>
                <motion.div
                  style={{
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    pointerEvents: buttonPointerEvents,
                  }}
                >
                  <RecordButton size={16} />
                </motion.div>
                <motion.div
                  style={{
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    pointerEvents: buttonPointerEvents,
                  }}
                >
                  <PromptInputSubmit
                    disabled={
                      // Enable button when streaming so user can stop
                      status === "streaming" || status === "submitted"
                        ? false
                        : (!input && !status) ||
                          isUploading ||
                          isRecording ||
                          isProcessing
                    }
                    status={status}
                    onClick={
                      status === "streaming" || status === "submitted"
                        ? handleStopClick
                        : undefined
                    }
                  />
                </motion.div>
              </PromptInputTools>
            </PromptInputToolbar>
          </motion.div>
        </PromptInput>
      </motion.div>
    </motion.div>
  );
}

export function ChatInput() {
  const { isHome } = useChatInterface();
  const [selectedType] = useQueryState("artifact-type", parseAsString);
  const isCanvasVisible = !!selectedType;

  return (
    <motion.div
      initial={isHome ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "fixed bottom-6 z-[100]",
        !isHome && "transition-all duration-300 ease-in-out",
        "left-0 md:left-[70px] px-4 md:px-6",
        isCanvasVisible ? "right-0 md:right-[603px]" : "right-0",
        isHome && "chat-input-static",
      )}
    >
      <ChatHistoryProvider>
        <ChatInputContent />
      </ChatHistoryProvider>
    </motion.div>
  );
}
