"use client";

import { Loader } from "@midday/ui/loader";
import { AnimatedStatus } from "@/components/animated-status";
import {
  getArtifactSectionMessageForStatus,
  getArtifactStageMessageForStatus,
  getStatusMessage,
  getToolMessage,
} from "@/lib/agent-utils";
import {
  type ArtifactStage,
  type ArtifactType,
  getArtifactTypeFromTool,
  TOOL_TO_ARTIFACT_MAP,
} from "@/lib/artifact-config";
import { getToolIcon } from "@/lib/tool-config";
import type { AgentStatus } from "@/types/agents";

interface ChatStatusIndicatorsProps {
  agentStatus: AgentStatus | null;
  currentToolCall: string | null;
  status?: string;
  artifactStage?: ArtifactStage | null;
  artifactType?: ArtifactType | null;
  currentSection?: string | null;
  bankAccountRequired?: boolean;
  hasTextContent?: boolean;
  hasInsightData?: boolean;
}

export function ChatStatusIndicators({
  agentStatus,
  currentToolCall,
  status,
  artifactStage,
  artifactType,
  currentSection,
  bankAccountRequired = false,
  hasTextContent = false,
  hasInsightData = false,
}: ChatStatusIndicatorsProps) {
  // Don't show status indicators when bank account is required or when insight data is being displayed
  if (bankAccountRequired || hasInsightData) {
    return null;
  }
  const statusMessage = getStatusMessage(agentStatus);
  const toolMessage = getToolMessage(currentToolCall);

  // Determine artifact type from tool name or use provided artifact type
  const resolvedArtifactType =
    artifactType || getArtifactTypeFromTool(currentToolCall);
  const isStreaming = status === "streaming" || status === "submitted";

  // Show artifact status when:
  // 1. Tool is actively running and maps to an artifact, OR
  // 2. Artifact exists and is still being built (not complete or still streaming)
  // BUT NOT when text content is already streaming
  const shouldShowArtifactStatus =
    !hasTextContent &&
    resolvedArtifactType &&
    artifactStage &&
    (currentToolCall || (artifactStage !== "analysis_ready" && isStreaming));

  let displayMessage: string | null = null;
  if (shouldShowArtifactStatus) {
    // Show section message if available, otherwise show stage message
    const sectionMessage = getArtifactSectionMessageForStatus(
      resolvedArtifactType,
      currentSection ?? null,
    );
    const stageMessage = getArtifactStageMessageForStatus(
      resolvedArtifactType,
      artifactStage,
    );
    displayMessage = sectionMessage || stageMessage;
  } else {
    // Default behavior: prioritize tool message over agent status
    displayMessage = toolMessage || statusMessage;
  }

  // Get icon for current tool - show icon when tool is running or when showing artifact status
  // Find the tool name that maps to the artifact type for icon display
  const getToolNameForArtifact = (type: ArtifactType | null): string | null => {
    if (!type) return null;
    const toolEntry = Object.entries(TOOL_TO_ARTIFACT_MAP).find(
      ([, artifactType]) => artifactType === type,
    );
    return toolEntry ? toolEntry[0] : null;
  };

  const toolIcon = currentToolCall
    ? getToolIcon(currentToolCall)
    : displayMessage &&
        artifactStage &&
        artifactStage !== "analysis_ready" &&
        resolvedArtifactType
      ? getToolIcon(getToolNameForArtifact(resolvedArtifactType) || "")
      : null;

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
