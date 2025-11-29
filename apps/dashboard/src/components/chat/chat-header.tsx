"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { ChatNavigation } from "./chat-navigation";
import { ChatTitle } from "./chat-title";
import { NewChatButton } from "./new-chat-button";

export function ChatHeader() {
  const { isHome } = useChatInterface();

  return (
    <div className="flex items-center justify-center relative h-8">
      <ChatNavigation />
      <ChatTitle />
      {!isHome && (
        <div className="absolute right-0 flex items-center gap-2">
          <NewChatButton />
        </div>
      )}
    </div>
  );
}
