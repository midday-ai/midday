"use client";

import type { ChatStatus, ToolUIPart, UIMessage } from "ai";
import { useMemo } from "react";
import {
  extractBankAccountRequired,
  extractInsightData,
} from "@/lib/chat-utils";

interface ChatStatusResult {
  currentToolCall: string | null;
  hasTextContent: boolean;
  hasInsightData: boolean;
  bankAccountRequired: boolean;
}

/**
 * Hook to derive chat status indicators from messages and streaming state.
 *
 * - Tool message: shown when a tool is actively running
 * - Hidden: when text content is streaming or chat is ready
 */
export function useChatStatus(
  messages: UIMessage[],
  status: ChatStatus,
): ChatStatusResult {
  const result = useMemo(() => {
    if (messages.length === 0) {
      return {
        currentToolCall: null,
        hasTextContent: false,
        hasInsightData: false,
        bankAccountRequired: false,
      };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== "assistant") {
      return {
        currentToolCall: null,
        hasTextContent: false,
        hasInsightData: false,
        bankAccountRequired: false,
      };
    }

    // Check if we have text content streaming
    const textParts = lastMessage?.parts?.filter(
      (part) => part.type === "text",
    );

    const hasTextContent = textParts.some((part) => {
      const textPart = part as { text?: string };
      return textPart.text?.trim();
    });

    // Check if we have insight data (should hide loading indicator when insight is rendering)
    const hasInsightData = extractInsightData(lastMessage.parts) !== null;

    // Find active tool calls - check ALL tool-related parts
    const allParts = lastMessage.parts;

    // Check if bank account is required
    const bankAccountRequired = extractBankAccountRequired(allParts);

    const toolParts = allParts.filter((part) => {
      const type = part.type;
      return type.startsWith("tool-");
    }) as ToolUIPart[];

    let currentToolCall: string | null = null;
    let _toolMetadata: Record<string, unknown> | null = null;

    // Check if any web search is still pending (no output yet)
    const hasPendingWebSearch = toolParts.some((part) => {
      const type = part.type as string;
      const toolWithOutput = part as Record<string, unknown>;
      return type === "tool-webSearch" && !toolWithOutput.output;
    });

    // If web searches are active, prioritize showing that
    if (hasPendingWebSearch) {
      // Find the most recent web search for the query text
      for (let i = toolParts.length - 1; i >= 0; i--) {
        const tool = toolParts[i];
        const type = tool?.type as string;
        if (type === "tool-webSearch") {
          const toolWithMeta = tool as Record<string, unknown>;
          currentToolCall = "webSearch";
          _toolMetadata = toolWithMeta;
          break;
        }
      }
    } else if (toolParts.length > 0) {
      // No web searches active, get the most recent tool
      const tool = toolParts[toolParts.length - 1];
      const toolWithMeta = tool as Record<string, unknown>;
      const type = tool?.type as string;

      // Extract tool name from type (e.g., "tool-cashFlow" -> "cashFlow")
      const toolName =
        type === "dynamic-tool"
          ? (toolWithMeta.toolName as string)
          : type.replace(/^tool-/, "");

      currentToolCall = toolName;
      _toolMetadata = toolWithMeta;
    }

    // Hide tool indicator when content is streaming or complete
    if (
      currentToolCall &&
      (hasTextContent || hasInsightData || status === "ready")
    ) {
      currentToolCall = null;
      _toolMetadata = null;
    }

    // Hide tool call when bank account is required
    const finalToolCall = bankAccountRequired ? null : currentToolCall;

    return {
      currentToolCall: finalToolCall,
      hasTextContent,
      hasInsightData,
      bankAccountRequired,
    };
  }, [messages, status]);

  return result;
}
