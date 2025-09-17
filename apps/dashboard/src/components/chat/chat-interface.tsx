"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "./chat-input";
import { Messages } from "./messages";

type Props = {
  initialTitle?: string | null;
};

export function ChatInterface({ initialTitle }: Props) {
  return (
    <div className="relative h-full overflow-hidden w-full">
      <ChatHeader title={initialTitle} />

      <div className="relative w-full">
        <Messages />
        <ChatInput />
      </div>
    </div>
  );
}
