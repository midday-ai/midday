"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  ManusMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import { LogEvents } from "@midday/events/events";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useOpenPanel } from "@openpanel/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectorsModal } from "@/components/modals/connectors-modal";
import type { ConnectedApp } from "./chat-context";

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
  connectedApps?: ConnectedApp[];
  mentionedApps?: ConnectedApp[];
  onMentionApp?: (app: ConnectedApp) => void;
  onRemoveMention?: (slug: string) => void;
};

function AppLogo({
  src,
  name,
  size = 14,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        className="bg-muted flex items-center justify-center text-[8px] font-medium rounded-sm shrink-0"
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-sm shrink-0"
      unoptimized
    />
  );
}

function createMentionSpan(app: {
  slug: string;
  name: string;
  logo: string | null;
}): HTMLSpanElement {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.mentionSlug = app.slug;
  span.dataset.mentionName = app.name;
  span.className =
    "inline-flex items-center gap-1 border border-border px-1 text-[11px] text-muted-foreground align-middle mx-0.5 select-none";
  span.style.lineHeight = "16px";
  span.style.verticalAlign = "middle";

  if (app.logo) {
    const img = document.createElement("img");
    img.src = app.logo;
    img.alt = app.name;
    img.width = 12;
    img.height = 12;
    img.className = "rounded-sm shrink-0";
    span.appendChild(img);
  } else {
    const initial = document.createElement("span");
    initial.className =
      "bg-muted inline-flex items-center justify-center text-[7px] font-medium rounded-sm shrink-0";
    initial.style.width = "12px";
    initial.style.height = "12px";
    initial.textContent = app.name.charAt(0).toUpperCase();
    span.appendChild(initial);
  }

  const nameEl = document.createElement("span");
  nameEl.textContent = app.name;
  span.appendChild(nameEl);

  return span;
}

function extractTextValue(el: HTMLElement): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node instanceof HTMLBRElement) {
      text += "\n";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mentionSlug) {
        text += `@${node.dataset.mentionName ?? ""}`;
      } else {
        if (node.tagName === "DIV" && text.length > 0 && !text.endsWith("\n")) {
          text += "\n";
        }
        text += extractTextValue(node);
      }
    }
  }
  return text;
}

function getMentionSlugsFromDOM(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>("[data-mention-slug]"))
    .map((span) => span.dataset.mentionSlug!)
    .filter(Boolean);
}

function getTextBeforeCursorInEditable(el: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "";

  const range = sel.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);

  const fragment = preRange.cloneContents();
  const temp = document.createElement("div");
  temp.appendChild(fragment);
  return extractTextValue(temp);
}

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
  connectedApps,
  mentionedApps,
  onMentionApp,
  onRemoveMention,
}: ChatInputProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const appsPanelRef = useRef<HTMLDivElement>(null);
  const extractedValueRef = useRef(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [suggestions] = useState(pickSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [showAppsPanel, setShowAppsPanel] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [connectorsModalOpen, setConnectorsModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [, setParams] = useQueryStates({ "mcp-app": parseAsString });
  const { track } = useOpenPanel();

  const mentionedSlugs = new Set(mentionedApps?.map((a) => a.slug));
  const availableApps = connectedApps?.filter(
    (a) => !mentionedSlugs.has(a.slug),
  );

  const filteredApps =
    mentionQuery != null
      ? availableApps?.filter((a) =>
          a.name.toLowerCase().startsWith(mentionQuery.toLowerCase()),
        )
      : availableApps;

  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;

    if (value !== extractedValueRef.current) {
      if (value === "") {
        el.innerHTML = "";
      } else {
        el.textContent = value;
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      extractedValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && mounted) {
      editableRef.current?.focus();
    }
  }, [autoFocus, mounted]);

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

  useEffect(() => {
    if (!showAppsPanel) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        appsPanelRef.current &&
        !appsPanelRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-apps-toggle]")
      ) {
        setShowAppsPanel(false);
        setMentionQuery(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAppsPanel]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
      if (!valid.length) return;
      setFiles((prev) => [...prev, ...valid]);
      track(LogEvents.AssistantFileAttached.name, { count: valid.length });
    },
    [track],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    editableRef.current?.focus();
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
      editableRef.current?.focus();
    };
    input.click();
  }, [addFiles]);

  const closeMentionPanel = useCallback(() => {
    setShowAppsPanel(false);
    setMentionQuery(null);
    setHighlightedIndex(0);
  }, []);

  const insertMention = useCallback(
    (app: ConnectedApp) => {
      onMentionApp?.(app);

      const el = editableRef.current;
      if (!el) {
        closeMentionPanel();
        return;
      }

      const sel = window.getSelection();
      const mentionSpan = createMentionSpan(app);
      const spaceNode = document.createTextNode(" ");

      if (mentionQuery != null && sel && sel.rangeCount > 0) {
        const focusNode = sel.focusNode;
        const focusOffset = sel.focusOffset;

        if (focusNode && focusNode.nodeType === Node.TEXT_NODE) {
          const text = focusNode.textContent ?? "";
          const beforeCursor = text.slice(0, focusOffset);
          const atIdx = beforeCursor.lastIndexOf("@");

          if (atIdx !== -1) {
            const beforeAt = text.slice(0, atIdx);
            const afterCursor = text.slice(focusOffset);
            const parent = focusNode.parentNode!;

            if (beforeAt) {
              parent.insertBefore(document.createTextNode(beforeAt), focusNode);
            }
            parent.insertBefore(mentionSpan, focusNode);
            parent.insertBefore(spaceNode, focusNode);
            if (afterCursor) {
              parent.insertBefore(
                document.createTextNode(afterCursor),
                focusNode,
              );
            }
            parent.removeChild(focusNode);
          }
        }
      } else {
        el.appendChild(mentionSpan);
        el.appendChild(spaceNode);
      }

      const range = document.createRange();
      range.setStartAfter(spaceNode);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);

      const newText = extractTextValue(el);
      extractedValueRef.current = newText;
      onChange(newText);

      closeMentionPanel();
      el.focus();
    },
    [onMentionApp, mentionQuery, onChange, closeMentionPanel],
  );

  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;

    let text = extractTextValue(el);

    if (!text.trim() && getMentionSlugsFromDOM(el).length === 0) {
      text = "";
      if (el.innerHTML !== "") {
        el.innerHTML = "";
      }
    }

    extractedValueRef.current = text;
    onChange(text);

    if (mentionedApps && onRemoveMention) {
      const domSlugs = new Set(getMentionSlugsFromDOM(el));
      for (const app of mentionedApps) {
        if (!domSlugs.has(app.slug)) {
          onRemoveMention(app.slug);
        }
      }
    }

    const textBeforeCursor = getTextBeforeCursorInEditable(el);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (
      atIndex !== -1 &&
      (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]!))
    ) {
      const query = textBeforeCursor.slice(atIndex + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query);
        setShowAppsPanel(true);
        setHighlightedIndex(0);
        return;
      }
    }

    if (mentionQuery != null) {
      closeMentionPanel();
    }
  }, [
    onChange,
    mentionedApps,
    onRemoveMention,
    mentionQuery,
    closeMentionPanel,
  ]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop();
      return;
    }
    if (!value.trim() && !files.length) return;
    onSubmit(files.length ? files : undefined);
    setFiles([]);
  }, [value, files, isStreaming, onSubmit, onStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showAppsPanel && filteredApps && filteredApps.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % filteredApps.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (i) => (i - 1 + filteredApps.length) % filteredApps.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const app = filteredApps[highlightedIndex];
        if (app) insertMention(app);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
    if (e.key === "Escape") {
      if (showAppsPanel) {
        closeMentionPanel();
        return;
      }
      if (showSuggestions) {
        setShowSuggestions(false);
        return;
      }
      if (mcpOpen) {
        setMcpOpen(false);
        return;
      }
      editableRef.current?.blur();
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

      {showAppsPanel && (
        <div
          ref={appsPanelRef}
          className={cn(
            "absolute left-0 right-0 bg-[rgba(247,247,247,0.96)] dark:bg-[rgba(19,19,19,0.98)] backdrop-blur-lg max-h-[220px] overflow-y-auto z-30",
            menuPosition === "above" ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <div className="p-1">
            <p className="px-2 py-1 text-[10px] text-[#878787]">
              Connected apps
            </p>
            {!connectedApps || connectedApps.length === 0 ? (
              <div className="px-2 pt-3 pb-4 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-[#878787] hover:text-foreground transition-colors"
                  onClick={() => {
                    closeMentionPanel();
                    setConnectorsModalOpen(true);
                  }}
                >
                  Connect apps
                  <Icons.ChevronRight size={12} />
                </button>
              </div>
            ) : filteredApps && filteredApps.length > 0 ? (
              filteredApps.map((app, i) => (
                <button
                  key={app.slug}
                  type="button"
                  className={cn(
                    "flex items-center gap-2 w-full px-2.5 py-2.5 text-xs text-[#666] transition-colors",
                    i === highlightedIndex
                      ? "bg-black/5 dark:bg-white/5"
                      : "hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMention(app)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <AppLogo src={app.logo} name={app.name} />
                  <span>{app.name}</span>
                </button>
              ))
            ) : (
              <p className="px-2.5 py-2.5 text-xs text-[#878787]">
                {mentionQuery ? "No matching apps" : "All apps are mentioned"}
              </p>
            )}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <AttachmentPreview files={files} onRemove={removeFile} />
      )}

      <div className="relative px-4 pt-4 pb-2.5 min-h-[52px]">
        <div
          ref={editableRef}
          contentEditable={mounted}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline={true}
          tabIndex={0}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full text-sm leading-[22px] outline-none max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words"
        />
        {!value.trim() && (
          <div className="absolute top-4 left-4 text-sm leading-[22px] text-[#878787]/60 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

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
              closeMentionPanel();
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

          <button
            type="button"
            data-apps-toggle
            onClick={() => {
              const next = !showAppsPanel;
              setShowAppsPanel(next);
              if (next) {
                setMentionQuery(null);
                setHighlightedIndex(0);
                setShowSuggestions(false);
                setMcpOpen(false);
              }
            }}
            className={cn(
              "flex items-center h-6 cursor-pointer text-sm font-medium transition-colors",
              showAppsPanel
                ? "text-foreground"
                : "text-[#878787]/60 hover:text-foreground",
            )}
          >
            @
          </button>

          <Popover
            open={mcpOpen}
            onOpenChange={(open) => {
              setMcpOpen(open);
              if (open) {
                setShowSuggestions(false);
                closeMentionPanel();
              }
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
                  data-track="MCP App Selected"
                  data-app={name}
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
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isStreaming && !value.trim() && !files.length}
          {...(isStreaming
            ? { "data-track": LogEvents.AssistantStopped.name }
            : {})}
          className="size-7 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isStreaming ? (
            <Icons.Stop className="size-3.5" />
          ) : (
            <Icons.ArrowUpward className="size-3.5" />
          )}
        </button>
      </div>

      <ConnectorsModal
        open={connectorsModalOpen}
        onOpenChange={setConnectorsModalOpen}
      />
    </div>
  );
}
