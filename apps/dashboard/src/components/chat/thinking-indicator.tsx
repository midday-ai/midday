import { TextShimmer } from "@midday/ui/text-shimmer";
import { STATUS_ROW } from "./chat-utils";

export function ThinkingIndicator() {
  return (
    <div className={STATUS_ROW}>
      <TextShimmer className="text-xs font-normal" duration={0.75}>
        Thinking...
      </TextShimmer>
    </div>
  );
}
