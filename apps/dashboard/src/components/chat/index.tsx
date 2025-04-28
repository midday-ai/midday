"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useChat } from "@ai-sdk/react";
import { ScrollArea } from "@midday/ui/scroll-area";
import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { ChatFooter } from "./chat-footer";
import { ChatList } from "./chat-list";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({});

  const { data: user } = useUserQuery();

  const showExamples = messages.length === 0 && !input;

  return (
    <div className="relative">
      <ScrollArea className="todesktop:h-[335px] md:h-[335px]">
        <div>
          {messages.length ? (
            <ChatList messages={messages} className="p-4 pb-8" />
          ) : (
            <ChatEmpty firstName={user?.full_name?.split(" ").at(0) ?? ""} />
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-[1px] left-[1px] right-[1px] todesktop:h-[88px] md:h-[88px] bg-background border-border border-t-[1px]">
        {showExamples && <ChatExamples onSubmit={handleSubmit} />}

        <form onSubmit={handleSubmit}>
          <input
            name="prompt"
            placeholder="Ask Midday a question..."
            value={input}
            onChange={handleInputChange}
            className="h-12 min-h-12 px-2 border-none w-full text-[#878787] placeholder:text-[#878787] text-sm"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
          />
        </form>

        <ChatFooter onSubmit={() => handleSubmit()} />
      </div>
    </div>
  );
}
