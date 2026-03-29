"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { getAccessToken } from "@/utils/session";

export type ChatMode = "auto" | "instant" | "thinking";

const chatTransport = new DefaultChatTransport({
  api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
  headers: async () => {
    const token = await getAccessToken();
    return token
      ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
      : ({} as Record<string, string>);
  },
  body: () => ({
    mode: localStorage.getItem("chat-mode") ?? "auto",
  }),
});

export type RateLimitInfo = { limit: number; remaining: number };

export type ChatState = ReturnType<typeof useChat> & {
  inputValue: string;
  setInputValue: (v: string) => void;
  chatTitle: string | null;
  setChatTitle: (v: string | null) => void;
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  plan: string;
  rateLimit: RateLimitInfo | null;
  rateLimitExceeded: boolean;
};

const ChatContext = createContext<ChatState | null>(null);

export function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

function getInitialMode(): ChatMode {
  if (typeof window === "undefined") return "auto";
  return (localStorage.getItem("chat-mode") as ChatMode) ?? "auto";
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: userData } = useUserQuery();
  const plan = userData?.team?.plan ?? "trial";

  const [inputValue, setInputValue] = useState("");
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [mode, setModeState] = useState<ChatMode>(getInitialMode);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  const setMode = (m: ChatMode) => {
    setModeState(m);
    localStorage.setItem("chat-mode", m);
  };

  const chat = useChat({
    transport: chatTransport,
    experimental_throttle: 50,
    onData: (part: any) => {
      if (part.type === "data-title" && part.data?.title) {
        setChatTitle(part.data.title);
      }
      if (part.type === "data-rate-limit" && part.data) {
        setRateLimit(part.data as RateLimitInfo);
        setRateLimitExceeded(false);
      }
    },
    onError: (err) => {
      if (err.message?.includes("RATE_LIMIT_EXCEEDED")) {
        setRateLimitExceeded(true);
        return;
      }
      console.error("Chat error:", err);
    },
  });

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        inputValue,
        setInputValue,
        chatTitle,
        setChatTitle,
        mode,
        setMode,
        plan,
        rateLimit,
        rateLimitExceeded,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
