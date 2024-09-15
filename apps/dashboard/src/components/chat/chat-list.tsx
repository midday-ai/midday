"use client";

import type { ClientMessage } from "@/actions/ai/types";
import { cn } from "@midday/ui/cn";

type Props = {
  messages: ClientMessage[];
  className?: string;
};

export function ChatList({ messages, className }: Props) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-col select-text", className)}>
      {messages
        .filter((tool) => tool.display !== undefined)
        .map((message, index) => (
          <div key={message.id}>
            {message.display}
            {index < messages.length - 1 && <div className="my-6" />}
          </div>
        ))}
    </div>
  );
}
