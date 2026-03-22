"use client";

import { Loader } from "@midday/ui/loader";
import { AnimatedStatus } from "@/components/animated-status";
import { getToolMessage } from "@/lib/agent-utils";
import { getToolIcon } from "@/lib/tool-config";

interface ChatStatusIndicatorsProps {
  currentToolCall: string | null;
  status?: string;
  bankAccountRequired?: boolean;
  hasTextContent?: boolean;
  hasInsightData?: boolean;
}

export function ChatStatusIndicators({
  currentToolCall,
  status,
  bankAccountRequired = false,
  hasTextContent = false,
  hasInsightData = false,
}: ChatStatusIndicatorsProps) {
  if (bankAccountRequired || hasInsightData) {
    return null;
  }

  const toolMessage = getToolMessage(currentToolCall);
  const isStreaming = status === "streaming" || status === "submitted";

  const displayMessage =
    !hasTextContent && currentToolCall ? toolMessage : null;

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

      {isStreaming && !currentToolCall && !hasTextContent && <Loader />}
    </div>
  );
}
