"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";

const SHORTCUT_SUGGESTIONS = [
  "Show latest transactions",
  "Show cash burn and top 3 vendor increases",
  "Show where we're spending the most this month",
  "Show weekly trends and insights",
  "Show revenue performance",
  "Show expense breakdown by category",
  "Show profit margins",
  "Show cash runway",
  "Show cash flow stress test",
];

export function HeaderAssistantInputPreview() {
  const [isBoltActive, setIsBoltActive] = useState(true);

  return (
    <div className="w-full h-full flex flex-col p-4 bg-background">
      {/* Shortcut Suggestions */}
      <div className="flex-1 overflow-y-auto mb-3 border border-border bg-background">
        <div className="p-1 space-y-0.5">
          {SHORTCUT_SUGGESTIONS.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-2 py-1.5 text-[10px] cursor-pointer transition-colors font-sans",
                index === 0 ? "text-foreground bg-muted" : "text-foreground/50",
              )}
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="flex flex-col border border-border bg-secondary">
        {/* Input Field */}
        <div className="flex items-center px-3 py-2.5">
          <input
            type="text"
            placeholder="Ask anything"
            className="flex-1 bg-transparent border-0 outline-none text-[11px] text-foreground placeholder:text-muted-foreground"
            readOnly
          />
        </div>

        {/* Icons Row */}
        <div className="flex items-end justify-between px-3 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Add size={14} />
            </button>
            <button
              type="button"
              className={cn(
                "w-5 h-5 flex items-center justify-center transition-colors",
                isBoltActive ? "text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setIsBoltActive(!isBoltActive)}
            >
              <Icons.Bolt size={14} />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Globle size={14} />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Time size={14} />
            </button>
          </div>
          <div className="flex items-end gap-1.5">
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Record size={14} />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center transition-opacity bg-foreground"
            >
              <Icons.ArrowUpward size={12} className="text-background" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
