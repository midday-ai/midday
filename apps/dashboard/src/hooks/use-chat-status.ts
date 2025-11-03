"use client";

import type { AgentStatus } from "@/types/agents";
import { useDataPart } from "@ai-sdk-tools/store";
import type { ChatStatus, ToolUIPart, UIMessage } from "ai";
import { useMemo } from "react";

interface ChatStatusResult {
  agentStatus: AgentStatus | null;
  currentToolCall: string | null;
  hasTextContent: boolean;
}

/**
 * Hook to derive chat status indicators from messages and streaming state.
 *
 * This hook manages the logic for showing agent status and tool messages:
 * - Agent status: shown when routing or executing (before content starts)
 * - Tool message: shown when a tool is actively running
 * - Hidden: when text content is streaming or chat is ready
 */
export function useChatStatus(
  messages: UIMessage[],
  status: ChatStatus,
): ChatStatusResult {
  const [agentStatusData] = useDataPart<AgentStatus>("agent-status");

  const result = useMemo(() => {
    if (messages.length === 0) {
      return {
        agentStatus: agentStatusData,
        currentToolCall: null,
        hasTextContent: false,
      };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== "assistant") {
      return {
        agentStatus: agentStatusData,
        currentToolCall: null,
        hasTextContent: false,
      };
    }

    // Check if we have text content streaming
    const textParts = lastMessage.parts.filter((part) => part.type === "text");
    const hasTextContent = textParts.some((part) => {
      const textPart = part as { text?: string };
      return textPart.text?.trim();
    });

    // Find active tool calls - check ALL tool-related parts
    const allParts = lastMessage.parts;

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

    // Hide tool when text starts streaming or when complete
    if (currentToolCall && (hasTextContent || status === "ready")) {
      currentToolCall = null;
      _toolMetadata = null;
    }

    // Hide agent status when streaming text, when complete, or when tool is showing
    const agentStatus =
      status === "ready" || hasTextContent || currentToolCall
        ? null
        : agentStatusData;

    return {
      agentStatus,
      currentToolCall,
      hasTextContent,
    };
  }, [messages, status, agentStatusData]);

  return result;
}
