import type { MessageDataParts, UITools } from "@api/ai/tools/registry";
import type { Database } from "@db/client";
import type { UIMessage } from "ai";

export type ToolContext = {
  db: Database;
  teamId: string;
  userId: string;
  locale?: string | null;
};

// Define message metadata type
export type ChatMessageMetadata = {
  internal?: boolean;
  toolCall?: {
    toolName: string;
    toolParams: Record<string, any>;
  };
};

// Define the UI chat message type with proper metadata and tool typing
export type UIChatMessage = UIMessage<
  ChatMessageMetadata,
  MessageDataParts,
  UITools
>;
