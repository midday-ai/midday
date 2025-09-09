import type { MessageDataParts } from "@api/ai/tools/registry";
import type { UIMessage } from "ai";

// Re-export ToolContext from context file for convenience
export type { ToolContext } from "@api/ai/context";

// Define UITools as a generic type to avoid circular dependencies
// This will be properly typed when used with the actual tool registry
export type UITools = Record<string, any>;

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
