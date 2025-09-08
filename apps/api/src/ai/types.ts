import type { MessageDataParts, UITools } from "@api/ai/tools/registry";
import type { Database } from "@db/client";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import type { UIMessage, UIMessageStreamWriter } from "ai";

export type ToolContext = {
  db: Database;
  writer: UIMessageStreamWriter;
  user: ChatUserContext;
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
