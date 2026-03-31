import { Chat } from "@ai-sdk/react";
import type { FileUIPart, UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { create } from "zustand";
import { getAccessToken } from "@/utils/session";

export type RateLimitInfo = { limit: number; remaining: number };

export type ConnectedApp = {
  slug: string;
  name: string;
  logo: string | null;
};

interface ChatStoreState {
  chat: Chat<UIMessage>;
  chatId: string;
  inputValue: string;
  chatTitle: string | null;
  rateLimit: RateLimitInfo | null;
  rateLimitExceeded: boolean;
  mentionedApps: ConnectedApp[];

  setInputValue: (v: string) => void;
  addMentionedApp: (app: ConnectedApp) => void;
  removeMentionedApp: (slug: string) => void;
  clearMentionedApps: () => void;
  resetChat: () => void;
  sendMessage: (opts: {
    text: string;
    files?: FileList | FileUIPart[];
  }) => void;
  stop: () => void;
}

const chatTransport = new DefaultChatTransport({
  api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
  headers: async () => {
    const token = await getAccessToken();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-user-timezone": timezone,
    } as Record<string, string>;
  },
  body: () => ({
    mentionedApps: useChatStore
      .getState()
      .mentionedApps.map((a) => ({ slug: a.slug, name: a.name })),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    localTime: new Date().toISOString(),
  }),
});

function createChat(id: string): Chat<UIMessage> {
  return new Chat({
    id,
    generateId: nanoid,
    transport: chatTransport,
    onData: (part: any) => {
      if (part.type === "data-title" && part.data?.title) {
        useChatStore.setState({ chatTitle: part.data.title });
      }
      if (part.type === "data-rate-limit" && part.data) {
        useChatStore.setState({
          rateLimit: part.data as RateLimitInfo,
          rateLimitExceeded: false,
        });
      }
    },
    onError: (err) => {
      if (err.message?.includes("RATE_LIMIT_EXCEEDED")) {
        useChatStore.setState({ rateLimitExceeded: true });
        return;
      }
      console.error("Chat error:", err);
    },
  });
}

const initialId = nanoid();

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  chat: createChat(initialId),
  chatId: initialId,
  inputValue: "",
  chatTitle: null,
  rateLimit: null,
  rateLimitExceeded: false,
  mentionedApps: [],

  setInputValue: (v) => set({ inputValue: v }),

  addMentionedApp: (app) => {
    const { mentionedApps } = get();
    if (mentionedApps.some((a) => a.slug === app.slug)) return;
    set({ mentionedApps: [...mentionedApps, app] });
  },

  removeMentionedApp: (slug) => {
    set({ mentionedApps: get().mentionedApps.filter((a) => a.slug !== slug) });
  },

  clearMentionedApps: () => set({ mentionedApps: [] }),

  resetChat: () => {
    const id = nanoid();
    set({
      chat: createChat(id),
      chatId: id,
      chatTitle: null,
      inputValue: "",
      rateLimit: null,
      rateLimitExceeded: false,
      mentionedApps: [],
    });
  },

  sendMessage: (opts) => get().chat.sendMessage(opts),
  stop: () => get().chat.stop(),
}));
