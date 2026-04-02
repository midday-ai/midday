"use client";

import { LogEvents } from "@midday/events/events";
import { useOpenPanel } from "@openpanel/nextjs";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect } from "react";
import type { ConnectedApp } from "@/components/chat/chat-context";
import { useChatState } from "@/components/chat/chat-context";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatInvoiceCanvas } from "@/components/chat/chat-invoice-canvas";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/chat/conversation";
import { filesToUIParts } from "@/components/chat/file-utils";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";

export function InputBar({
  isActive,
  hasMessages,
  inputValue,
  isStreaming,
  onChange,
  onSubmit,
  onStop,
  onEscape,
  onSuggestion,
  menuPosition,
  connectedApps,
  mentionedApps,
  onMentionApp,
  onRemoveMention,
}: {
  isActive?: boolean;
  hasMessages?: boolean;
  inputValue: string;
  isStreaming: boolean;
  onChange: (v: string) => void;
  onSubmit: (files?: File[]) => void;
  onStop: () => void;
  onEscape?: () => void;
  onSuggestion?: (text: string) => void;
  menuPosition?: "above" | "below";
  connectedApps?: ConnectedApp[];
  mentionedApps?: ConnectedApp[];
  onMentionApp?: (app: ConnectedApp) => void;
  onRemoveMention?: (slug: string) => void;
}) {
  return (
    <div className="bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg">
      <ChatInput
        value={inputValue}
        onChange={onChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isStreaming={isStreaming}
        placeholder={hasMessages ? "Reply..." : "How can I help you today?"}
        autoFocus={isActive}
        onEscape={onEscape}
        onSuggestion={onSuggestion}
        menuPosition={menuPosition}
        connectedApps={connectedApps}
        mentionedApps={mentionedApps}
        onMentionApp={onMentionApp}
        onRemoveMention={onRemoveMention}
      />
    </div>
  );
}

export function ChatView({ header }: { header?: React.ReactNode }) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    inputValue,
    setInputValue,
    rateLimit,
    rateLimitExceeded,
    mentionedApps,
    addMentionedApp,
    removeMentionedApp,
    clearMentionedApps,
  } = useChatState();
  const { track } = useOpenPanel();

  const trpc = useTRPC();
  const { data: connectedApps } = useQuery(
    trpc.connectors.connections.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000,
    }),
  );

  const { canvas, setParams: setInvoiceParams } = useInvoiceParams();
  const isCanvasOpen = canvas === true;

  const canvasSpring = { type: "spring" as const, stiffness: 400, damping: 40 };

  useEffect(() => {
    return () => {
      useInvoiceEditorStore.getState().reset();
      setInvoiceParams(null);
    };
  }, [setInvoiceParams]);

  const handleInvoiceUpdate = useCallback(
    (invoiceId: string) => {
      useInvoiceEditorStore.getState().reset();
      setInvoiceParams({ canvas: true, invoiceId });
    },
    [setInvoiceParams],
  );

  const isStreaming = status === "streaming" || status === "submitted";
  const showLimitWarning =
    rateLimitExceeded || (rateLimit && rateLimit.remaining <= 10);

  const handleSubmit = useCallback(
    async (rawFiles?: File[]) => {
      if (!inputValue.trim() && !rawFiles?.length) return;
      if (isStreaming) return;
      const text = inputValue.trim();
      setInputValue("");
      clearMentionedApps();
      const files = rawFiles?.length
        ? await filesToUIParts(rawFiles)
        : undefined;
      sendMessage({ text: text || "Attached files", files });
    },
    [inputValue, isStreaming, sendMessage, setInputValue, clearMentionedApps],
  );

  return (
    <div className="relative flex flex-col h-[calc(100vh-160px)]">
      <motion.div
        className="flex flex-col flex-1 min-h-0"
        animate={{ marginRight: isCanvasOpen ? 650 : 0 }}
        transition={canvasSpring}
      >
        <Conversation className="flex-1 hide-scrollbar">
          <ConversationContent className="gap-4 p-0 pb-28">
            {header && (
              <div className="sticky top-0 z-20 flex items-center justify-between pt-4 pb-2 bg-background/[0.99] backdrop-blur-xl">
                {header}
              </div>
            )}
            <div className="max-w-[680px] mx-auto w-full pt-12 whitespace-normal">
              <ChatMessages
                messages={messages}
                status={status}
                onInvoiceUpdate={handleInvoiceUpdate}
              />
            </div>
          </ConversationContent>
          <ConversationScrollButton
            className={showLimitWarning ? "bottom-[105px]" : "bottom-[55px]"}
          />
        </Conversation>

        {error && !rateLimitExceeded && (
          <p className="text-xs text-destructive text-center py-2">
            Something went wrong. Please try again.
          </p>
        )}
      </motion.div>

      <motion.div
        className="fixed bottom-0 left-0 md:left-[70px] right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 z-40 px-4"
        animate={{ right: isCanvasOpen ? 650 : 0 }}
        transition={canvasSpring}
      >
        <div className="max-w-[680px] mx-auto w-full">
          <AnimatePresence>
            {showLimitWarning && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg px-4 py-1.5 mb-0.5">
                  <p className="text-center text-[11px] text-[#878787]/50">
                    {rateLimitExceeded
                      ? "Message limit reached. Please wait a few minutes."
                      : rateLimit?.remaining === 0
                        ? "Message limit reached. Please wait a few minutes."
                        : `${rateLimit?.remaining} ${rateLimit?.remaining === 1 ? "message" : "messages"} remaining`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <InputBar
            isActive
            hasMessages
            inputValue={inputValue}
            isStreaming={isStreaming}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            menuPosition="above"
            connectedApps={connectedApps}
            mentionedApps={mentionedApps}
            onMentionApp={addMentionedApp}
            onRemoveMention={removeMentionedApp}
            onSuggestion={(text) => {
              track(LogEvents.AssistantSuggestionUsed.name, {
                suggestion: text,
              });
              sendMessage({ text });
            }}
          />
          <p className="text-center text-[11px] text-[#878787]/50 pt-1.5">
            Midday AI can make mistakes. Please double-check responses.
          </p>
        </div>
      </motion.div>

      <ChatInvoiceCanvas />
    </div>
  );
}
