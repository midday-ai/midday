"use client";

import { AnimatedStatus } from "@/components/animated-status";
import { getStatusMessage, getToolMessage } from "@/lib/agent-utils";
import { getToolIcon } from "@/lib/tool-config";
import type { AgentStatus } from "@/types/agents";
import { Loader } from "@midday/ui/loader";

interface ChatStatusIndicatorsProps {
  agentStatus: AgentStatus | null;
  currentToolCall: string | null;
  status?: string;
}

export function ChatStatusIndicators({
  agentStatus,
  currentToolCall,
  status,
}: ChatStatusIndicatorsProps) {
  const statusMessage = getStatusMessage(agentStatus);
  const toolMessage = getToolMessage(currentToolCall);

  // Always prioritize tool message over agent status when a tool is running
  const displayMessage = toolMessage || statusMessage;

  // Get icon for current tool - always show icon when tool is running
  const toolIcon = currentToolCall ? getToolIcon(currentToolCall) : null;

  return (
    <div className="h-8 flex items-center">
      <AnimatedStatus
        text={displayMessage ?? null}
        shimmerDuration={0.75}
        fadeDuration={0.1}
        variant="slide"
        className="text-xs font-normal"
        icon={toolIcon}
      />

      {((agentStatus && !getStatusMessage(agentStatus)) ||
        (status === "submitted" && !agentStatus && !currentToolCall)) && (
        <Loader />
      )}
    </div>
  );
}
