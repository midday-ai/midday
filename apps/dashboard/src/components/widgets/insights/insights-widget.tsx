"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

export function InsightsWidget({ items }) {
  const { setOpen } = useCommandStore();

  return (
    <div className="-mt-10">
      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink">
        {items.map((example) => (
          <li
            key={example.id}
            className="rounded-lg dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => setOpen(MenuOption.AI)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="absolute bottom-8 left-8 right-8">
        <div className="relative">
          <Input
            placeholder="Ask Midday AI a question..."
            className="w-full h-11 rounded-lg cursor-pointer bg-background"
            onFocus={() => setOpen(MenuOption.AI)}
          />
          <Icons.LogoIcon className="absolute right-3 bottom-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
