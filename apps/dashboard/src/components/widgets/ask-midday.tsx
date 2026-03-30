"use client";

import { useCallback } from "react";
import { useChatState } from "@/components/chat/chat-context";
import { InputBar } from "@/components/chat/chat-view";
import { filesToUIParts } from "@/components/chat/file-utils";
import { ConnectorsBar } from "./connectors-bar";

export function AskMidday({ onChatOpen }: { onChatOpen: () => void }) {
  const {
    sendMessage,
    setMessages,
    status,
    stop,
    inputValue,
    setInputValue,
    setChatTitle,
    mode,
    setMode,
    plan,
  } = useChatState();

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    async (rawFiles?: File[]) => {
      if (!inputValue.trim() && !rawFiles?.length) return;
      if (isStreaming) return;
      const text = inputValue.trim();
      setInputValue("");
      setMessages([]);
      setChatTitle(null);
      const files = rawFiles?.length
        ? await filesToUIParts(rawFiles)
        : undefined;
      sendMessage({ text: text || "Attached files", files });
      onChatOpen();
    },
    [
      inputValue,
      isStreaming,
      sendMessage,
      setMessages,
      setInputValue,
      setChatTitle,
      onChatOpen,
    ],
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setMessages([]);
      setChatTitle(null);
      sendMessage({ text: suggestion });
      onChatOpen();
    },
    [sendMessage, setMessages, setChatTitle, onChatOpen],
  );

  return (
    <div className="pb-6 w-full">
      <div className="relative z-10">
        <InputBar
          inputValue={inputValue}
          isStreaming={isStreaming}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onStop={stop}
          onSuggestion={handleSuggestion}
          mode={mode}
          onModeChange={setMode}
          plan={plan}
        />
      </div>
      <ConnectorsBar />
    </div>
  );
}
