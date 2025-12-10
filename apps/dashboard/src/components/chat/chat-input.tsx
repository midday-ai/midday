"use client";

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
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const status = useChatStatus();
  const { sendMessage, stop } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { isMetricsTab } = useOverviewTab();
  const { scrollY } = useWindowScroll();
  const { isOpen: isHistoryOpen } = useChatHistoryContext();

  const [, clearSuggestions] = useDataPart<{ prompts: string[] }>(
    "suggestions",
  );

  const [selectedType] = useQueryState("artifact-type", parseAsString);

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
    handleInputChange,
    handleKeyDown,
    resetCommandState,
  } = useChatStore();

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

  // Use direct motion value for scroll-synced animations (no spring lag)
  // Spring physics cause lag for scroll-synced animations, so we use direct interpolation
  const minimizationFactor = useMotionValue(targetMinimizationFactor);

  // Update motion value immediately when target changes (syncs with scroll)
  useEffect(() => {
    minimizationFactor.set(targetMinimizationFactor);
  }, [targetMinimizationFactor, minimizationFactor]);

  // Transform motion value to actual style values - all smoothly interpolated
  const containerMaxWidth = useTransform(
    minimizationFactor,
    (factor) => `${770 - factor * (770 - 400)}px`,
  );

  // Container padding - keep constant, don't animate
  const containerPadding = 0;

  // Button animations
  const buttonOpacity = useTransform(
    minimizationFactor,
    (factor) => 1 - factor,
  );
  const buttonScale = useTransform(
    minimizationFactor,
    (factor) => 1 - factor * 0.05,
  );
  const buttonTranslateX = useTransform(
    minimizationFactor,
    (factor) => -factor * 2,
  );

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
  // Alignment - only center when minimized, otherwise don't set (let default behavior)
  const containerAlignItems = useTransform(minimizationFactor, (factor) =>
    factor > 0.15 ? "center" : undefined,
  );
  const bodyAlignItems = useTransform(minimizationFactor, (factor) =>
    factor > 0.15 ? "center" : undefined,
  );
  // Interpolate textarea values smoothly - all values use continuous interpolation
  // Height: smoothly interpolate, allowing natural growth when not minimized
  const textareaMinHeightValue = useTransform(
    minimizationFactor,
    (factor) => 32 * factor, // Smoothly interpolate from 0 to 32
  );
  const textareaMaxHeightValue = useTransform(minimizationFactor, (factor) => {
    // When minimized: 32px, when not minimized: use a reasonable max (around 120px)
    // Smoothly interpolate from 120px to 32px
    return 120 - factor * (120 - 32);
  });
  const textareaHeightValue = useTransform(minimizationFactor, (factor) => {
    // When minimized: fixed 32px, when not minimized: use a reasonable height that allows growth
    // Smoothly interpolate from auto (large value) to 32px
    if (factor < 0.01) {
      return undefined; // Let it grow naturally when not minimized
    }
    // Smoothly interpolate to 32px when minimized
    return 32;
  });
  const textareaPaddingYValue = useTransform(
    minimizationFactor,
    (factor) => 8 - factor * 4, // Smooth interpolation from 8px to 4px
  );
  const textareaPaddingXValue = useTransform(
    minimizationFactor,
    (factor) => 12 - factor * 4, // Smooth interpolation from 12px to 8px
  );

  // For backward compatibility, also calculate shouldMinimize boolean
  const shouldMinimize = targetMinimizationFactor > 0;

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

      <motion.div
        style={{
          padding: containerPadding,
          flexDirection: containerFlexDirection,
          ...(targetMinimizationFactor > 0.15 && { alignItems: "center" }),
        }}
        className="!bg-[rgba(247,247,247,0.85)] dark:!bg-[rgba(19,19,19,0.7)] backdrop-blur-lg flex"
        layout
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
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
              ...(targetMinimizationFactor > 0.15 && { alignItems: "center" }),
            }}
            layout
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
                  minHeight: textareaMinHeightValue,
                  maxHeight: textareaMaxHeightValue,
                  height: textareaHeightValue,
                  paddingTop: textareaPaddingYValue,
                  paddingBottom: textareaPaddingYValue,
                  // paddingLeft: textareaPaddingXValue,
                  // paddingRight: textareaPaddingXValue,
                  overflow: useTransform(minimizationFactor, (factor) =>
                    factor > 0.5 ? "hidden" : "visible",
                  ),
                  textOverflow: useTransform(minimizationFactor, (factor) =>
                    factor > 0.5 ? "ellipsis" : "clip",
                  ),
                  whiteSpace: useTransform(minimizationFactor, (factor) =>
                    factor > 0.5 ? "nowrap" : "normal",
                  ),
                  flex: useTransform(minimizationFactor, (factor) =>
                    factor > 0.5 ? 1 : undefined,
                  ),
                }}
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  autoFocus
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    // Allow normal blur - shouldMinimize already checks for showCommands
                    setIsFocused(false);
                  }}
                  className="w-full h-full border-none bg-transparent resize-none outline-none"
                  style={{
                    minHeight: "inherit",
                    maxHeight: "inherit",
                    height: "inherit",
                    paddingTop: "inherit",
                    paddingBottom: "inherit",
                  }}
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
            // style={{
            //   paddingBottom: useTransform(
            //     minimizationFactor,
            //     (f) => 8 - f * 8, // Smoothly interpolate from 8px to 0px
            //   ),
            //   paddingLeft: useTransform(
            //     minimizationFactor,
            //     (f) => 12 - f * 12, // Smoothly interpolate from 12px to 0px
            //   ),
            //   paddingRight: useTransform(
            //     minimizationFactor,
            //     (f) => 12 - f * 12, // Smoothly interpolate from 12px to 0px
            //   ),
            // }}
            layout
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
                    x: buttonTranslateX,
                    pointerEvents: shouldMinimize ? "none" : "auto",
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
                    x: buttonTranslateX,
                    pointerEvents: shouldMinimize ? "none" : "auto",
                  }}
                >
                  <RecordButton size={16} />
                </motion.div>
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
    <div
      className={cn(
        "fixed bottom-6 z-[100] transition-all duration-300 ease-in-out",
        "left-0 md:left-[70px] px-4 md:px-6",
        isCanvasVisible ? "right-0 md:right-[603px]" : "right-0",
        isHome && "chat-input-static",
      )}
    >
      <ChatHistoryProvider>
        <ChatInputContent />
      </ChatHistoryProvider>
    </div>
  );
}
