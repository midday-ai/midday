"use client";

import { chatExamples } from "@/components/chat/examples";
import { useAssistantStore } from "@/store/assistant";
import { shuffle } from "@midday/utils";

export function InsightList() {
  const { setOpen } = useAssistantStore();

  const items = shuffle(chatExamples).slice(0, 4);

  return (
    <div className="mt-12">
      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink">
        {items.map((example) => (
          <li
            key={example}
            className="rounded-full dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => setOpen(example)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
