"use client";

import { LogEvents } from "@midday/events/events";
import { useOpenPanel } from "@openpanel/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useChatState } from "@/components/chat/chat-context";
import { InputBar } from "@/components/chat/chat-view";
import { filesToUIParts } from "@/components/chat/file-utils";
import { useTRPC } from "@/trpc/client";
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

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    async (rawFiles?: File[]) => {
      if (!inputValue.trim() && !rawFiles?.length) return;
      if (isStreaming) return;
      const text = inputValue.trim();
      flushSync(() => {
        setInputValue("");
        setMessages([]);
        setChatTitle(null);
      });
      clearMentionedApps();
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
      clearMentionedApps,
      onChatOpen,
    ],
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      track(LogEvents.AssistantSuggestionUsed.name, { suggestion });
      flushSync(() => {
        setMessages([]);
        setChatTitle(null);
      });
      sendMessage({ text: suggestion });
      onChatOpen();
    },
    [sendMessage, setMessages, setChatTitle, onChatOpen, track],
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
          connectedApps={connectedApps}
          mentionedApps={mentionedApps}
          onMentionApp={addMentionedApp}
          onRemoveMention={removeMentionedApp}
        />
      </div>
      <ConnectorsBar />
    </div>
  );
}
