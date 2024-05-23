"use client";

import type { ClientMessage } from "@/actions/ai/chat";
import { cn } from "@midday/ui/cn";
import { ChatAvatar } from "./chat-avatar";

type Props = {
  message: ClientMessage;
};

export function ChatMessage({ message }: Props) {
  return (
    <div className="flex space-x-4">
      <div>
        <ChatAvatar role={message.role} />
      </div>
      <div
        className={cn(
          message.role !== "assistant" && "text-[#878787]",
          "text-xs font-mono"
        )}
      >
        {message.display}
      </div>
    </div>
  );
}
