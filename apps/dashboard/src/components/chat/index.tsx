"use client";

import type { ClientMessage } from "@/actions/ai/chat";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";
import { useState } from "react";
import { ChatEmpty } from "./chat-empty";
import { ChatList } from "./chat-list";

export function Chat() {
  const [input, setInput] = useState<string>("");
  const [messages, submitMessage] = useUIState();
  const { continueConversation } = useActions();

  const onSubmit = async (value: string) => {
    if (value.length === 0) {
      return null;
    }

    setInput("");
    scrollToBottom();

    submitMessage((message: ClientMessage[]) => [
      ...message,
      { id: nanoid(), role: "user", display: value },
    ]);

    const message = await continueConversation(value);

    submitMessage((messages: ClientMessage[]) => [...messages, message]);
  };

  const { messagesRef, scrollRef, visibilityRef, scrollToBottom } =
    useScrollAnchor();

  return (
    <div className="relative">
      <div className="overflow-auto h-[375px]" ref={scrollRef}>
        <div ref={messagesRef}>
          {messages.length ? (
            <ChatList messages={messages} />
          ) : (
            <ChatEmpty onSubmit={(value) => onSubmit(value)} />
          )}

          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </div>

      <div className="fixed bottom-[1px] left-[1px] right-[1px] h-[50px] border-border border-t-[1px] bg-background">
        <Input
          type="text"
          value={input}
          className="border-none h-12"
          placeholder="Ask Midday a question..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit(input);
            }
          }}
          onChange={(evt) => {
            setInput(evt.target.value);
          }}
        />

        <Button
          className="absolute right-3 bottom-3 size-6"
          size="icon"
          onClick={onSubmit}
        >
          <Icons.Enter size={18} />
        </Button>
      </div>
    </div>
  );
}
