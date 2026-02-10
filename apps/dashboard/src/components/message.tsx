import { TextShimmer } from "@midday/ui/text-shimmer";
import {
  type SupportedToolName,
  ToolCallIndicator,
} from "@midday/ui/tool-call-indicator";

export const ThinkingMessage = () => {
  return (
    <TextShimmer className="text-sm" duration={1}>
      Thinking...
    </TextShimmer>
  );
};

type ActiveToolCallProps = {
  toolName: string;
};

export const ActiveToolCall = ({ toolName }: ActiveToolCallProps) => {
  // Type assertion to ensure compatibility with our supported tool names
  const supportedToolName = toolName as SupportedToolName;

  return <ToolCallIndicator toolName={supportedToolName} />;
};
