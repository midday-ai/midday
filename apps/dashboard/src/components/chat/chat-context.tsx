"use client";

import { useChat } from "@ai-sdk/react";
import { LogEvents } from "@midday/events/events";
import { useOpenPanel } from "@openpanel/nextjs";
import { DefaultChatTransport } from "ai";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAccessToken } from "@/utils/session";

export type RateLimitInfo = { limit: number; remaining: number };

export type ConnectedApp = {
  slug: string;
  name: string;
  logo: string | null;
};

export type ChatState = ReturnType<typeof useChat> & {
  inputValue: string;
  setInputValue: (v: string) => void;
  chatTitle: string | null;
  setChatTitle: (v: string | null) => void;
  rateLimit: RateLimitInfo | null;
  rateLimitExceeded: boolean;
  mentionedApps: ConnectedApp[];
  addMentionedApp: (app: ConnectedApp) => void;
  removeMentionedApp: (slug: string) => void;
  clearMentionedApps: () => void;
};

const ChatContext = createContext<ChatState | null>(null);

export function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { track } = useOpenPanel();

  const [inputValue, setInputValue] = useState("");
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [mentionedApps, setMentionedApps] = useState<ConnectedApp[]>([]);

  const mentionedAppsRef = useRef(mentionedApps);
  mentionedAppsRef.current = mentionedApps;

  const addMentionedApp = useCallback((app: ConnectedApp) => {
    setMentionedApps((prev) => {
      if (prev.some((a) => a.slug === app.slug)) return prev;
      return [...prev, app];
    });
  }, []);

  const removeMentionedApp = useCallback((slug: string) => {
    setMentionedApps((prev) => prev.filter((a) => a.slug !== slug));
  }, []);

  const clearMentionedApps = useCallback(() => {
    setMentionedApps([]);
  }, []);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
        headers: async () => {
          const token = await getAccessToken();
          const timezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-user-timezone": timezone,
          } as Record<string, string>;
        },
        body: () => ({
          mentionedApps: mentionedAppsRef.current.map((a) => ({
            slug: a.slug,
            name: a.name,
          })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
          localTime: new Date().toISOString(),
        }),
      }),
    [],
  );

  const chat = useChat({
    transport: chatTransport,
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

  const trackedSendMessage: typeof chat.sendMessage = useCallback(
    (...args) => {
      track(LogEvents.AssistantMessageSent.name);
      return chat.sendMessage(...args);
    },
    [chat.sendMessage, track],
  );

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        sendMessage: trackedSendMessage,
        inputValue,
        setInputValue,
        chatTitle,
        setChatTitle,
        rateLimit,
        rateLimitExceeded,
        mentionedApps,
        addMentionedApp,
        removeMentionedApp,
        clearMentionedApps,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
