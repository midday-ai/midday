"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { shuffle } from "@midday/utils";
import { useEffect, useState } from "react";

const defaultExamples = [
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
    label: "How much did I spend on software last year?",
  },
  {
    id: 4,
    label: "Show me all transactions without receipts last month",
  },
  {
    id: 5,
    label: "Show me all recurring costs this year",
  },
  {
    id: 6,
    label: "Show me recurring services we paying for",
  },
  {
    id: 7,
    label: "What are our biggest expeend categories?",
  },
];

export function InsightsWidget() {
  const { setOpen } = useCommandStore();
  const [items, setItems] = useState([]);

  useEffect(() => {
    // TODO: Get latest questions from localStorage
    const randomExamples = shuffle(defaultExamples).slice(0, 5);
    setItems(randomExamples);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ul className="flex h-full flex-col justify-center items-center space-y-3">
        {items.map((example) => (
          <li
            key={example.id}
            className="rounded-lg dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => setOpen(MenuOption.AI)}
              type="button"
              className="block p-3 py-2"
            >
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
