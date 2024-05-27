import type { CoreMessage } from "ai";

export type Message = CoreMessage & {
  id: string;
};

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  messages: Message[];
}

export type SettingsResponse = {
  provider: "openai" | "mistralai";
  enabled: boolean;
};

export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];
