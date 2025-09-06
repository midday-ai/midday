"use client";

import { SuggestedActions } from "../suggested-actions";
import { OverviewWidgets } from "./overeview-widgets";
import { OverviewHeader } from "./overview-header";

type Props = {
  handleToolCall: ({
    toolName,
    toolParams,
    text,
  }: {
    toolName: string;
    toolParams: Record<string, any>;
    text: string;
  }) => void;
};

export function Overview({ handleToolCall }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <OverviewHeader />
      <OverviewWidgets />
      <SuggestedActions handleToolCall={handleToolCall} />
    </div>
  );
}
