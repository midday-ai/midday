"use client";

import { useAssistantStore } from "@/store/assistant";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

type Props = {
  items: string[];
};

export function InsightsWidget({ items }: Props) {
  const { setOpen } = useAssistantStore();

  return (
    <div className="-mt-10">
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
      <div className="absolute bottom-8 left-8 right-8">
        <div className="relative">
          <Input
            placeholder="Ask Solomon a question..."
            className="w-full h-11 cursor-pointer bg-background"
            onFocus={() => setOpen()}
          />
          <Icons.LogoIcon className="absolute right-3 bottom-3.5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
