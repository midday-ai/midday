"use client";

import { cn } from "@midday/ui/cn";
import type { UIMessage } from "ai";
import { BotMessage, UserMessage } from "./messages";

type Props = {
  messages: Array<UIMessage>;
  className?: string;
};

export function ChatList({ messages, className }: Props) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-col select-text", className)}>
      {messages.map((message, index) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserMessage>{message.content}</UserMessage>
          ) : (
            <BotMessage content={message.content} />
          )}
          {index < messages.length - 1 && <div className="my-6" />}
        </div>
      ))}
    </div>
  );
}
