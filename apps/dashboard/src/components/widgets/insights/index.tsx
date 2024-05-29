import { chatExamples } from "@/components/chat/examples";
import { shuffle } from "@midday/utils";
import { InsightsWidget } from "./insights-widget";

export function Insights() {
  const items = shuffle(chatExamples).slice(0, 4);

  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-8">
      <h2 className="text-lg">Assistant</h2>

      <div className="flex flex-1 flex-col justify-center items-center">
        <InsightsWidget items={items} />
      </div>
    </div>
  );
}
