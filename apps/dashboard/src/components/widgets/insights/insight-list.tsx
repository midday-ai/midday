"use client";

import { useAssistantStore } from "@/store/assistant";

export function InsightList({ items }: { items: string[] }) {
  const { setOpen } = useAssistantStore();

  return (
    <div className="mb-12">
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
