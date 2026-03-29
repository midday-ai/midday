"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { getAccessToken } from "@/utils/session";

const chatTransport = new DefaultChatTransport({
  api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
  headers: async () => {
    const token = await getAccessToken();
    return token
      ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
      : ({} as Record<string, string>);
  },
});

export type ChatState = ReturnType<typeof useChat> & {
  inputValue: string;
  setInputValue: (v: string) => void;
  chatTitle: string | null;
  setChatTitle: (v: string | null) => void;
};

const ChatContext = createContext<ChatState | null>(null);

export function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [inputValue, setInputValue] = useState("");
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const chat = useChat({
    transport: chatTransport,
    experimental_throttle: 50,
    onData: (part: any) => {
      if (part.type === "data-title" && part.data?.title) {
        setChatTitle(part.data.title);
      }
    },
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  return (
    <ChatContext.Provider
      value={{ ...chat, inputValue, setInputValue, chatTitle, setChatTitle }}
    >
      {children}
    </ChatContext.Provider>
  );
}
