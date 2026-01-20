"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { TextShimmer } from "@midday/ui/text-shimmer";
import Link from "next/link";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
};

export type ChatPanelRef = {
  sendMessage: (message: string) => void;
};

export const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(
  function ChatPanel({ isOpen, onClose, initialMessage }, ref) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rateLimitReset, setRateLimitReset] = useState<number | null>(null);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const initialMessageSent = useRef(false);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Disable body scroll when panel is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Send initial message when panel opens with a message
    useEffect(() => {
      if (
        isOpen &&
        initialMessage &&
        !initialMessageSent.current &&
        messages.length === 0
      ) {
        initialMessageSent.current = true;
        sendMessageFn(initialMessage);
      }
    }, [isOpen, initialMessage]);

    // Reset when panel closes
    useEffect(() => {
      if (!isOpen) {
        initialMessageSent.current = false;
      }
    }, [isOpen]);

    const sendMessageFn = useCallback(
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
            assistantContent += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m,
              ),
            );
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

    // Expose sendMessage to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        sendMessage: sendMessageFn,
      }),
      [sendMessageFn],
    );

    const isRateLimited = rateLimitReset && rateLimitReset > Date.now();

    return (
      <>
        {/* Backdrop for mobile */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />
        )}

        {/* Panel */}
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 w-full md:w-[480px] lg:w-[520px]",
            "bg-background border-l border-border",
            "transform transition-transform duration-300 ease-in-out",
            "flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-center md:justify-between px-6 py-5 border-b border-border">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 md:relative md:left-auto md:order-2 p-1.5 hover:bg-secondary transition-colors shrink-0"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
            <h2 className="font-serif text-lg tracking-tight md:order-1">
              Assistant
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-6">
                    Ask anything about Midday
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
                    {[
                      "How do I create an invoice?",
                      "Connect my bank",
                      "Set up recurring invoices",
                      "Track time on projects",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => sendMessageFn(suggestion)}
                        className="px-3 py-1.5 bg-secondary rounded-tl-full rounded-tr-full rounded-bl-full text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(messages.length > 0 || isLoading) && (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2",
                      message.role === "user"
                        ? "justify-end"
                        : "flex-row-reverse justify-end",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] text-sm",
                        message.role === "user"
                          ? "bg-[#F7F7F7] dark:bg-[#131313] text-primary px-4 py-2 rounded-2xl rounded-br-none"
                          : "text-[#666666] dark:text-[#878787]",
                      )}
                    >
                      {message.role === "user" ? (
                        message.content
                      ) : (
                        <Streamdown
                          isAnimating={isLoading}
                          className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-4"
                          components={{
                            a: ({ href, children }) => (
                              <Link
                                href={href || "#"}
                                className="text-foreground underline underline-offset-2 hover:text-foreground/80"
                              >
                                {children}
                              </Link>
                            ),
                            p: ({ children }) => (
                              <p className="leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1.5 pl-4">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="space-y-1.5 pl-4 list-decimal">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed list-disc marker:text-muted-foreground/50">
                                {children}
                              </li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="font-serif text-lg text-foreground mt-6 mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="font-serif text-base text-foreground mt-5 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="font-medium text-sm text-foreground mt-4 mb-1.5">
                                {children}
                              </h3>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-medium text-foreground">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 bg-secondary text-foreground text-xs font-mono rounded">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="p-4 bg-secondary text-foreground text-xs font-mono rounded overflow-x-auto">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {message.content}
                        </Streamdown>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-center h-8">
                      <TextShimmer
                        className="text-xs font-normal"
                        duration={0.75}
                      >
                        Thinking...
                      </TextShimmer>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive mt-6 text-center">
                {error}
              </p>
            )}

            {/* Rate limit */}
            {isRateLimited && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Rate limit reached. Try again later or{" "}
                  <Link
                    href="/docs"
                    className="underline hover:text-foreground"
                  >
                    browse the docs
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Input - shown when there are messages */}
          {messages.length > 0 && (
            <div className="border-t border-border px-4 py-4 bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isLoading) {
                    // Stop streaming
                    abortControllerRef.current?.abort();
                    setIsLoading(false);
                    return;
                  }
                  if (!input.trim()) return;
                  sendMessageFn(input.trim());
                  setInput("");
                }}
              >
                <div className="relative bg-[#F7F7F7] dark:bg-[#131313]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up..."
                    disabled={isLoading}
                    className="w-full bg-transparent px-4 py-3 pr-12 text-sm outline-none placeholder:text-[rgba(102,102,102,0.5)] disabled:opacity-50"
                  />
                  <button
                    type={isLoading ? "button" : "submit"}
                    onClick={
                      isLoading
                        ? () => {
                            abortControllerRef.current?.abort();
                            setIsLoading(false);
                          }
                        : undefined
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <Icons.Stop className="size-3.5" />
                    ) : (
                      <Icons.ArrowUpward className="size-3.5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </>
    );
  },
);
