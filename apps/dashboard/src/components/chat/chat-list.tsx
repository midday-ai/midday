"use client";

import type { ClientMessage } from "@/actions/ai/chat";
import { ChatMessage } from "./messages";

type Props = {
  messages: ClientMessage[];
};

export function ChatList({ messages }: Props) {
  return (
    <div className="flex flex-col space-y-8 p-4 pb-8">
      {messages.map((message: ClientMessage) => (
        <ChatMessage message={message} key={message.id} />
      ))}
    </div>
  );
}
