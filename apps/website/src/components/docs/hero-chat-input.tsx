"use client";

import { Icons } from "@midday/ui/icons";
import { useEffect, useRef, useState } from "react";
import { useDocsChat } from "./docs-chat-provider";

type HeroChatInputProps = {
  onSubmit: (message: string) => void;
};

const suggestionsRow1 = [
  "How do I create an invoice?",
  "Connect my bank account",
  "Set up recurring invoices",
  "Track time on projects",
  "Export transactions to CSV",
  "Create a new customer",
  "View my dashboard",
];

const suggestionsRow2 = [
  "What's my runway?",
  "Show burn rate analysis",
  "View profit margins",
  "Match receipts automatically",
  "Send invoice reminder",
  "Add a new project",
  "Check account balances",
];

const suggestionsRow3 = [
  "Revenue vs last quarter",
  "Categorize my expenses",
  "Upload to document vault",
  "Track billable hours",
  "Generate financial report",
  "View overdue invoices",
  "Export for accountant",
];

export function HeroChatInput({ onSubmit }: HeroChatInputProps) {
  const { isChatOpen } = useDocsChat();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus input when chat is active (including on initial load with ?chat=true)
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    onSubmit(suggestion);
  };

  const SuggestionButton = ({ suggestion }: { suggestion: string }) => (
    <button
      type="button"
      onClick={() => handleSuggestion(suggestion)}
      className="px-3 py-1.5 bg-secondary rounded-tl-full rounded-tr-full rounded-bl-full text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
    >
      {suggestion}
    </button>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 md:px-0">
      <form onSubmit={handleSubmit}>
        <div className="relative bg-[#F7F7F7] dark:bg-[#131313]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            className="w-full bg-transparent px-4 py-3.5 md:py-4 pr-12 text-sm outline-none placeholder:text-[rgba(102,102,102,0.5)]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Icons.ArrowUpward className="size-4" />
          </button>
        </div>
      </form>

      {/* Mobile Suggestions - simple grid */}
      <div className="mt-5 flex flex-wrap gap-1.5 justify-center md:hidden">
        {["Create invoice", "Connect bank", "Track time", "View reports"].map(
          (suggestion) => (
            <SuggestionButton key={suggestion} suggestion={suggestion} />
          ),
        )}
      </div>

      {/* Animated Suggestions - desktop only */}
      <div className="mt-6 relative overflow-hidden group/suggestions animate-fade-blur-in hidden md:block">
        {/* Gradient fade masks */}
        <div
          className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 20%, hsla(var(--background), 0.8) 50%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 20%, hsla(var(--background), 0.8) 50%, transparent 100%)",
          }}
        />

        <div className="space-y-2">
          {/* Row 1 - moves left */}
          <div className="flex animate-marquee-left group-hover/suggestions:[animation-play-state:paused]">
            <div className="flex gap-1.5 shrink-0 pr-1.5">
              {suggestionsRow1.map((suggestion) => (
                <SuggestionButton key={suggestion} suggestion={suggestion} />
              ))}
            </div>
            <div className="flex gap-1.5 shrink-0 pr-1.5" aria-hidden="true">
              {suggestionsRow1.map((suggestion) => (
                <SuggestionButton
                  key={`dup-${suggestion}`}
                  suggestion={suggestion}
                />
              ))}
            </div>
          </div>

          {/* Row 2 - moves right */}
          <div className="flex animate-marquee-right group-hover/suggestions:[animation-play-state:paused]">
            <div className="flex gap-1.5 shrink-0 pr-1.5">
              {suggestionsRow2.map((suggestion) => (
                <SuggestionButton key={suggestion} suggestion={suggestion} />
              ))}
            </div>
            <div className="flex gap-1.5 shrink-0 pr-1.5" aria-hidden="true">
              {suggestionsRow2.map((suggestion) => (
                <SuggestionButton
                  key={`dup-${suggestion}`}
                  suggestion={suggestion}
                />
              ))}
            </div>
          </div>

          {/* Row 3 - moves left (slower) */}
          <div className="flex animate-marquee-left-slow group-hover/suggestions:[animation-play-state:paused]">
            <div className="flex gap-1.5 shrink-0 pr-1.5">
              {suggestionsRow3.map((suggestion) => (
                <SuggestionButton key={suggestion} suggestion={suggestion} />
              ))}
            </div>
            <div className="flex gap-1.5 shrink-0 pr-1.5" aria-hidden="true">
              {suggestionsRow3.map((suggestion) => (
                <SuggestionButton
                  key={`dup-${suggestion}`}
                  suggestion={suggestion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
