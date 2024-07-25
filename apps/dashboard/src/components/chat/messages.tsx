"use client";

import { useStreamableText } from "@/hooks/use-streamable-text";
import { cn } from "@midday/ui/cn";
import type { StreamableValue } from "ai/rsc";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { ErrorFallback } from "../error-fallback";
import { MemoizedReactMarkdown } from "../markdown";
import { ChatAvatar } from "./chat-avatar";
import { spinner } from "./spinner";

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex items-start">
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
        <ChatAvatar role="user" />
      </div>

      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2 text-xs font-mono leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start">
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
        <ChatAvatar role="assistant" />
      </div>

      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {spinner}
      </div>
    </div>
  );
}

export function BotMessage({
  content,
}: {
  content: string | StreamableValue<string>;
}) {
  const text = useStreamableText(content);

  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <div className="group relative flex items-start">
        <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
          <ChatAvatar role="assistant" />
        </div>

        <div className="ml-4 flex-1 overflow-hidden pl-2 text-xs font-mono">
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert leading-relaxed prose-pre:p-0 mb-2 last:mb-0 text-xs font-mono"
            components={{
              p({ children }) {
                return children;
              },
              ol({ children }) {
                return <ol>{children}</ol>;
              },
              ul({ children }) {
                return <ul>{children}</ul>;
              },
            }}
          >
            {text}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export function BotCard({
  children,
  showAvatar = true,
  className,
}: {
  children?: React.ReactNode;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <div className="group relative flex items-start">
        <div className="flex size-[25px] shrink-0 select-none items-center justify-center">
          {showAvatar && <ChatAvatar role="assistant" />}
        </div>

        <div
          className={cn(
            "ml-4 flex-1 space-y-2 overflow-hidden pl-2 text-xs font-mono leading-relaxed",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
}
