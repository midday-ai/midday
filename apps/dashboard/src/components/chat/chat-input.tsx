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
import { AnimatePresence, motion } from "framer-motion";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMode } from "./chat-context";

const MCP_CLIENTS = [
  { id: "claude-mcp", name: "Claude", Logo: ClaudeMcpLogo },
  { id: "chatgpt-mcp", name: "ChatGPT", Logo: ChatGPTMcpLogo },
  { id: "cursor-mcp", name: "Cursor", Logo: CursorMcpLogo },
  { id: "copilot-mcp", name: "Copilot", Logo: CopilotMcpLogo },
  { id: "perplexity-mcp", name: "Perplexity", Logo: PerplexityMcpLogo },
  { id: "manus-mcp", name: "Manus", Logo: ManusMcpLogo },
] as const;

const SUGGESTION_POOL: Record<string, string[]> = {
  insights: [
    "What's my burn rate and runway?",
    "Show profit margins this quarter",
    "Compare revenue this month vs last month",
    "Show my cash flow summary",
    "What's my growth rate this year?",
  ],
  transactions: [
    "Find large transactions this month",
    "Show recurring expenses I could cut",
    "Categorize my uncategorized transactions",
    "Show latest transactions",
    "Find duplicate transactions",
  ],
  invoicing: [
    "Show unpaid invoices",
    "Which invoices are overdue?",
    "Show invoice analytics this quarter",
    "Create an invoice for...",
  ],
  tracking: [
    "How many hours did I log this week?",
    "Show unbilled time by project",
    "Start a timer for...",
    "What projects have the most tracked time?",
  ],
  web: [
    "Can I afford a new MacBook Pro?",
    "What's the VAT rate in my country?",
    "How does my revenue compare to industry benchmarks?",
    "What are current exchange rates for my currencies?",
  ],
  operations: [
    "Show unmatched inbox items",
    "Which customers owe the most?",
    "Who on my team has unreviewed transactions?",
    "Show expense breakdown by category",
  ],
};

function pickSuggestions(): string[] {
  return Object.values(SUGGESTION_POOL).map(
    (items) => items[Math.floor(Math.random() * items.length)]!,
  );
}

const MODE_OPTIONS: {
  id: ChatMode;
  label: string;
  description: string;
  pro?: boolean;
}[] = [
  { id: "auto", label: "Auto", description: "Smart routing" },
  { id: "instant", label: "Instant", description: "Fast answers" },
  {
    id: "thinking",
    label: "Thinking",
    description: "Deep analysis",
    pro: true,
  },
];

const ACCEPTED_TYPES = "image/*,application/pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onEscape?: () => void;
  onSuggestion?: (text: string) => void;
  menuPosition?: "above" | "below";
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  plan?: string;
};

function AttachmentPreview({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-2 pb-1">
      <AnimatePresence mode="popLayout">
        {files.map((file, i) => (
          <motion.button
            key={`${file.name}-${file.size}`}
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            type="button"
            onClick={() => onRemove(i)}
            className="group flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/30 transition-colors max-w-[180px] overflow-hidden"
          >
            <Icons.Attachments
              size={13}
              className="flex-shrink-0 text-muted-foreground/40"
            />
            <span className="truncate">{file.name}</span>
            <Icons.Close
              size={10}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  placeholder = "How can I help you today?",
  autoFocus = false,
  onEscape,
  onSuggestion,
  menuPosition = "below",
  mode = "auto",
  onModeChange,
  plan,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [suggestions] = useState(pickSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [, setParams] = useQueryStates({ "mcp-app": parseAsString });

  const isPro = plan === "pro" || plan === "trial";
  const activeMode =
    MODE_OPTIONS.find((m) => m.id === mode) ?? MODE_OPTIONS[0]!;

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

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
    if (!valid.length) return;
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    textareaRef.current?.focus();
  }, []);

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES;
    input.multiple = true;
    input.onchange = () => {
      if (input.files?.length) {
        addFiles(Array.from(input.files));
      }
      textareaRef.current?.focus();
    };
    input.click();
  }, [addFiles]);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop();
      return;
    }
    if (!value.trim() && !files.length) return;
    onSubmit(files.length ? files : undefined);
    setFiles([]);
  }, [value, files, isStreaming, onSubmit, onStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files?.length) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="relative" onDrop={handleDrop} onDragOver={handleDragOver}>
      {showSuggestions && (
        <div
          ref={menuRef}
          className={cn(
            "absolute left-0 right-0 bg-[rgba(247,247,247,0.96)] dark:bg-[rgba(19,19,19,0.98)] backdrop-blur-lg max-h-[220px] overflow-y-auto z-30",
            menuPosition === "above" ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <div className="p-1">
            {suggestions.map((action) => (
              <button
                key={action}
                type="button"
                className="w-full text-left px-2.5 py-2.5 text-xs text-[#666] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <AttachmentPreview files={files} onRemove={removeFile} />
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2.5 text-sm outline-none placeholder:text-[#878787]/60 min-h-[52px] max-h-[150px]"
      />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            className="flex items-center h-6 cursor-pointer"
          >
            <Icons.Add
              size={16}
              className="text-[#878787]/60 hover:text-foreground transition-colors"
            />
          </button>

          <button
            type="button"
            data-suggestions-toggle
            onClick={() => {
              setShowSuggestions(!showSuggestions);
              setMcpOpen(false);
              setModeOpen(false);
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
              side={menuPosition === "above" ? "top" : "bottom"}
              align="start"
              sideOffset={12}
              className="w-[180px] p-1 bg-[rgba(247,247,247,0.96)] dark:bg-[rgba(19,19,19,0.98)] backdrop-blur-lg border-border shadow-sm"
            >
              <p className="px-2 py-1 text-[10px] text-[#878787]">
                Use Midday in
              </p>
              {MCP_CLIENTS.map(({ id, name, Logo }) => (
                <button
                  key={id}
                  type="button"
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#666] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setMcpOpen(false);
                    setParams({ "mcp-app": id });
                  }}
                >
                  <span className="size-4 overflow-hidden rounded-sm flex-shrink-0 [&_img]:!w-full [&_img]:!h-full [&_svg]:!w-full [&_svg]:!h-full">
                    <Logo />
                  </span>
                  <span>{name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="border-l border-border pl-3 ml-1 self-center h-4 flex items-center">
            <Popover
              open={modeOpen}
              onOpenChange={(open) => {
                setModeOpen(open);
                if (open) {
                  setShowSuggestions(false);
                  setMcpOpen(false);
                }
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center h-6 cursor-pointer text-xs transition-colors",
                    modeOpen
                      ? "text-foreground"
                      : "text-[#878787]/60 hover:text-foreground",
                  )}
                >
                  {activeMode.label}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side={menuPosition === "above" ? "top" : "bottom"}
                align="start"
                sideOffset={12}
                className="w-[260px] p-1 bg-[rgba(247,247,247,0.96)] dark:bg-[rgba(19,19,19,0.98)] backdrop-blur-lg border-border shadow-sm"
              >
                <p className="px-2 py-1 text-[10px] text-[#878787]">Model</p>
                {MODE_OPTIONS.map((opt) => {
                  const locked = opt.pro && !isPro;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 text-xs transition-colors",
                        locked && "opacity-50 cursor-default",
                        !locked && mode === opt.id
                          ? "text-foreground bg-black/5 dark:bg-white/5"
                          : "text-[#666] hover:bg-black/5 dark:hover:bg-white/5",
                      )}
                      onClick={() => {
                        if (locked) return;
                        onModeChange?.(opt.id);
                        setModeOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-1.5 flex-1 text-left">
                        {opt.label}
                        {locked && (
                          <span className="text-[9px] font-medium bg-border text-muted-foreground px-1 py-0.5">
                            Pro
                          </span>
                        )}
                      </span>
                      <span className="text-[#878787] text-[10px]">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isStreaming && !value.trim() && !files.length}
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
