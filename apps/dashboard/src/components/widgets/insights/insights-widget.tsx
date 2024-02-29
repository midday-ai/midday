"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";

const examples = [
  {
    id: 1,
    label: `What's my business burn rate?`,
  },
  {
    id: 2,
    label: "How much money did I earn last month?",
  },
  {
    id: 3,
    label: "What did I spend on software last year?",
  },
  {
    id: 4,
    label: "Show me all transactions without receipts last month",
  },
  {
    id: 5,
    label: "Show me all recurring costs this year",
  },
];

export function InsightsWidget() {
  const { setOpen } = useCommandStore();

  return (
    <div className="flex flex-col h-full">
      <ul className="flex h-full flex-col justify-center items-center space-y-3">
        {examples.map((example) => (
          <li
            key={example.id}
            className="rounded-lg dark:bg-secondary bg-[#F2F1EF] p-3 py-2 text-sm text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button onClick={() => setOpen(MenuOption.AI)} type="button">
              {example.label}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <div className="relative">
          <Input
            placeholder="Ask Midday AI a question..."
            className="w-full mt-auto mb-8 h-11 rounded-lg cursor-pointer"
            onFocus={() => setOpen(MenuOption.AI)}
          />
          <Icons.LogoIcon className="absolute right-3 bottom-3 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
