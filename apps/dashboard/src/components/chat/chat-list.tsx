"use client";

import type { ClientMessage } from "@/actions/ai/types";

type Props = {
  messages: ClientMessage[];
};

export function ChatList({ messages }: Props) {
  return (
    <div className="flex flex-col space-y-8 p-4 pb-8">
      {messages.map((message) => (
        <div key={message.id}>{message.display}</div>
      ))}
    </div>
  );
}
