"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  ManusMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";

const MCP_CLIENTS = [
  { id: "claude-mcp", name: "Claude", Logo: ClaudeMcpLogo },
  { id: "chatgpt-mcp", name: "ChatGPT", Logo: ChatGPTMcpLogo },
  { id: "cursor-mcp", name: "Cursor", Logo: CursorMcpLogo },
  { id: "copilot-mcp", name: "Copilot", Logo: CopilotMcpLogo },
  { id: "perplexity-mcp", name: "Perplexity", Logo: PerplexityMcpLogo },
  { id: "manus-mcp", name: "Manus", Logo: ManusMcpLogo },
] as const;

const SUGGESTED_ACTIONS = [
  "Show latest transactions",
  "Show where we're spending the most this month",
  "Show revenue performance",
  "Show expense breakdown by category",
  "Show profit margins",
  "Show cash runway",
  "Show weekly trends and insights",
  "Find untagged transactions from last month",
];

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onEscape?: () => void;
  onSuggestion?: (text: string) => void;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  placeholder = "Ask anything",
  autoFocus = false,
  onEscape,
  onSuggestion,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [, setParams] = useQueryStates({ "mcp-app": parseAsString });

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-suggestions-toggle]")
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        onStop();
      } else if (value.trim()) {
        onSubmit();
      }
    }
    if (e.key === "Escape") {
      if (showSuggestions) {
        setShowSuggestions(false);
        return;
      }
      if (mcpOpen) {
        setMcpOpen(false);
        return;
      }
      textareaRef.current?.blur();
      onEscape?.();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setShowSuggestions(false);
    if (onSuggestion) {
      onSuggestion(text);
    } else {
      onChange(text);
    }
  };

  return (
    <div className="relative">
      {showSuggestions && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-[rgba(247,247,247,0.95)] dark:bg-[rgba(19,19,19,0.95)] backdrop-blur-lg max-h-80 overflow-y-auto z-30"
        >
          <div className="p-1.5">
            {SUGGESTED_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-[#666] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm outline-none placeholder:text-[#878787]/60 min-h-[36px] max-h-[150px]"
      />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-suggestions-toggle
            onClick={() => {
              setShowSuggestions(!showSuggestions);
              setMcpOpen(false);
            }}
            className="flex items-center h-6 cursor-pointer"
          >
            <Icons.Bolt
              size={16}
              className={cn(
                "transition-colors",
                showSuggestions
                  ? "text-foreground"
                  : "text-[#878787]/60 hover:text-foreground",
              )}
            />
          </button>

          <Popover
            open={mcpOpen}
            onOpenChange={(open) => {
              setMcpOpen(open);
              if (open) setShowSuggestions(false);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center h-6 cursor-pointer"
              >
                <Icons.AddLink
                  size={16}
                  className={cn(
                    "-rotate-45 transition-colors",
                    mcpOpen
                      ? "text-foreground"
                      : "text-[#878787]/60 hover:text-foreground",
                  )}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="w-[220px] p-1.5 bg-[rgba(247,247,247,0.95)] dark:bg-[rgba(19,19,19,0.95)] backdrop-blur-lg border-border shadow-sm"
            >
              <p className="px-2.5 py-1.5 text-xs text-[#878787]">
                Use Midday in
              </p>
              {MCP_CLIENTS.map(({ id, name, Logo }) => (
                <button
                  key={id}
                  type="button"
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-sm text-[#666] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setMcpOpen(false);
                    setParams({ "mcp-app": id });
                  }}
                >
                  <span className="size-5 overflow-hidden rounded-sm flex-shrink-0 [&_img]:!w-full [&_img]:!h-full [&_svg]:!w-full [&_svg]:!h-full">
                    <Logo />
                  </span>
                  <span>{name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <button
          type="button"
          onClick={isStreaming ? onStop : onSubmit}
          disabled={!isStreaming && !value.trim()}
          className="size-7 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isStreaming ? (
            <Icons.Stop className="size-3.5" />
          ) : (
            <Icons.ArrowUpward className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
