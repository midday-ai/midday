"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { useDataPart } from "@ai-sdk-tools/store";
import type { ChatStatus, ToolUIPart, UIMessage } from "ai";
import { useMemo } from "react";
import type { ArtifactStage, ArtifactType } from "@/lib/artifact-config";
import { getSectionFromStage } from "@/lib/artifact-config";
import {
  extractBankAccountRequired,
  extractInsightData,
  hasInsightToolRunning,
} from "@/lib/chat-utils";
import type { AgentStatus } from "@/types/agents";

interface ChatStatusResult {
  agentStatus: AgentStatus | null;
  currentToolCall: string | null;
  hasTextContent: boolean;
  hasInsightData: boolean;
  artifactStage: ArtifactStage | null;
  artifactType: ArtifactType | null;
  currentSection: string | null;
  bankAccountRequired: boolean;
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
  const [{ current }] = useArtifacts({
    exclude: ["chat-title", "suggestions"],
  });

  const result = useMemo(() => {
    // Extract artifact stage generically for any artifact type
    let artifactStage: ArtifactStage | null = null;
    let artifactType: ArtifactType | null = null;
    let currentSection: string | null = null;

    // Check if current artifact has a stage property
    if (current?.type) {
      artifactType = current.type as ArtifactType;
      const stage = (current.payload as { stage?: ArtifactStage })?.stage;
      if (stage) {
        artifactStage = stage;
        // Map stage to current section using generic mapping
        currentSection = getSectionFromStage(stage);
      }
    }

    if (messages.length === 0) {
      return {
        agentStatus: agentStatusData,
        currentToolCall: null,
        hasTextContent: false,
        hasInsightData: false,
        artifactStage,
        artifactType,
        currentSection,
        bankAccountRequired: false,
      };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== "assistant") {
      return {
        agentStatus: agentStatusData,
        currentToolCall: null,
        hasTextContent: false,
        hasInsightData: false,
        artifactStage,
        artifactType,
        currentSection,
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

    // Check if insight tool is running (hide agent status as soon as tool starts)
    const isInsightToolActive = hasInsightToolRunning(lastMessage.parts);

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

    // Hide agent status when content is available or tool is showing
    const agentStatus =
      status === "ready" ||
      hasTextContent ||
      hasInsightData ||
      isInsightToolActive ||
      currentToolCall ||
      bankAccountRequired
        ? null
        : agentStatusData;

    // Hide tool call when bank account is required
    const finalToolCall = bankAccountRequired ? null : currentToolCall;

    return {
      agentStatus,
      currentToolCall: finalToolCall,
      hasTextContent,
      hasInsightData,
      artifactStage,
      artifactType,
      currentSection,
      bankAccountRequired,
    };
  }, [messages, status, agentStatusData, current]);

  return result;
}
