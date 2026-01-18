"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SuggestionChipsProps = {
  onSelect: (text: string) => void;
  visible: boolean;
};

const suggestions = [
  "Set up recurring invoices",
  "Connect my bank",
  "Receipt matching",
  "Track time on projects",
  "Check my runway",
  "Export for accountant",
];

function SuggestionChips({ onSelect, visible }: SuggestionChipsProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mt-6"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(`How do I ${suggestion.toLowerCase()}?`)}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 hover:bg-secondary/50 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function RateLimitMessage({ resetAt }: { resetAt: number }) {
  const [minutesLeft, setMinutesLeft] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, resetAt - now);
      setMinutesLeft(Math.ceil(diff / 60000));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <p className="text-foreground font-medium mb-2">
        You've used your questions for this hour
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        {minutesLeft > 0
          ? `Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}`
          : "Try again soon"}
      </p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Browse guides
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { href: "/docs/introduction", label: "Getting Started" },
          { href: "/docs/create-invoice", label: "Invoicing" },
          { href: "/docs/track-time-timer", label: "Time Tracking" },
          { href: "/docs/view-revenue-profit", label: "Reports" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 text-sm border border-border hover:bg-secondary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\[.*?\]\(.*?\))/g);

  return (
    <>
      {parts.map((part) => {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const href = linkMatch[2] ?? "#";
          const text = linkMatch[1] ?? "";
          return (
            <Link
              key={`link-${href}-${text}`}
              href={href}
              className="underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              {text}
            </Link>
          );
        }
        return part || null;
      })}
    </>
  );
}

export function DocsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitReset, setRateLimitReset] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/docs/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (response.status === 429) {
          const resetHeader = response.headers.get("X-RateLimit-Reset");
          setRateLimitReset(
            resetHeader ? Number(resetHeader) : Date.now() + 3600000,
          );
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        const assistantId = crypto.randomUUID();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m,
                  ),
                );
              } catch {
                const text = line.slice(2);
                if (text) {
                  assistantContent += text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: assistantContent }
                        : m,
                    ),
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError("Something went wrong. Please try again.");
        console.error("Chat error:", err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, messages],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionSelect = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  if (rateLimitReset && rateLimitReset > Date.now()) {
    return <RateLimitMessage resetAt={rateLimitReset} />;
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <AnimatePresence mode="wait">
        {hasMessages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-foreground text-background px-4 py-2.5"
                        : "text-foreground",
                    )}
                  >
                    <MessageContent content={message.content} />
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-1 py-2">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative border border-border bg-background">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
            className={cn(
              "w-full resize-none border-none p-4 pr-12 shadow-none outline-none ring-0 text-sm",
              "bg-transparent placeholder:text-muted-foreground/50",
              "min-h-[52px] max-h-[200px]",
              "focus:outline-none focus:ring-0",
              "disabled:opacity-50",
            )}
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />

          <div className="absolute right-3 bottom-3">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="p-1.5 bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <Icons.Stop className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={cn(
                  "p-1.5 transition-colors",
                  input.trim()
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "text-muted-foreground",
                )}
              >
                <Icons.ArrowUpward className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive mt-3 text-center">{error}</p>
      )}

      {/* Suggestions */}
      <SuggestionChips
        onSelect={handleSuggestionSelect}
        visible={!hasMessages}
      />
    </div>
  );
}
