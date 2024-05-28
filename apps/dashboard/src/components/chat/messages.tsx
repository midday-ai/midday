"use client";

import type { ClientMessage } from "@/actions/ai/types";
import { useStreamableText } from "@/hooks/use-streamable-text";
import { cn } from "@midday/ui/cn";
import type { StreamableValue } from "ai/rsc";
import { MemoizedReactMarkdown } from "../markdown";
import { ChatAvatar } from "./chat-avatar";
import { spinner } from "./spinner";

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex space-x-4 items-center">
      <div>
        <ChatAvatar role="user" />
      </div>

      <div className="text-xs font-mono w-full">{children}</div>
    </div>
  );
}

export function SpinnerMessage() {
  return spinner;
}

export function BotMessage({
  content,
}: {
  content: string | StreamableValue<string>;
}) {
  const text = useStreamableText(content);

  return (
    <div className="flex space-x-4 items-center">
      <div>
        <ChatAvatar role="assistant" />
      </div>

      <MemoizedReactMarkdown
        className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
        components={{
          p({ children }) {
            return (
              <p className="mb-2 last:mb-0 text-xs font-mono">{children}</p>
            );
          },
        }}
      >
        {text}
      </MemoizedReactMarkdown>
    </div>
  );
}
