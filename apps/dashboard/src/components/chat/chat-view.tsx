"use client";

import type React from "react";
import { useCallback } from "react";
import { useChatState } from "@/components/chat/chat-context";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/chat/conversation";
import { filesToUIParts } from "@/components/chat/file-utils";

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
}) {
  return (
    <div className="bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg">
      <ChatInput
        value={inputValue}
        onChange={onChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isStreaming={isStreaming}
        placeholder={hasMessages ? "Ask a follow-up..." : "Ask anything"}
        autoFocus={isActive}
        onEscape={onEscape}
        onSuggestion={onSuggestion}
      />
    </div>
  );
}

export function ChatView({
  onClose,
  header,
}: {
  onClose: () => void;
  header?: React.ReactNode;
}) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    inputValue,
    setInputValue,
  } = useChatState();

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    async (rawFiles?: File[]) => {
      if (!inputValue.trim() && !rawFiles?.length) return;
      if (isStreaming) return;
      const text = inputValue.trim();
      setInputValue("");
      const files = rawFiles?.length
        ? await filesToUIParts(rawFiles)
        : undefined;
      sendMessage({ text: text || "Attached files", files });
    },
    [inputValue, isStreaming, sendMessage, setInputValue],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <Conversation className="flex-1 hide-scrollbar">
        <ConversationContent className="gap-4 p-0 pb-20">
          {header && (
            <div className="sticky top-0 z-20 flex items-center justify-between pt-4 pb-2 bg-background/[0.99] backdrop-blur-xl">
              {header}
            </div>
          )}
          <div className="max-w-[680px] mx-auto w-full pt-12 whitespace-normal">
            <ChatMessages messages={messages} status={status} />
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <p className="text-xs text-destructive text-center py-2">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="fixed bottom-0 left-0 md:left-[70px] right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 z-40">
        <div className="max-w-[680px] mx-auto w-full px-4">
          <InputBar
            isActive
            hasMessages
            inputValue={inputValue}
            isStreaming={isStreaming}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            onSuggestion={(text) => {
              sendMessage({ text });
            }}
          />
        </div>
      </div>
    </div>
  );
}
