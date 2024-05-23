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
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  const onSubmit = async () => {
    setInput("");
    scrollToBottom();

    setConversation((currentConversation: ClientMessage[]) => [
      ...currentConversation,
      { id: nanoid(), role: "user", display: input },
    ]);

    const message = await continueConversation(input);

    setConversation((currentConversation: ClientMessage[]) => [
      ...currentConversation,
      message,
    ]);
  };

  const { messagesRef, scrollRef, visibilityRef, scrollToBottom } =
    useScrollAnchor();

  return (
    <div className="relative">
      <div className="overflow-auto h-[365px]" ref={scrollRef}>
        <div ref={messagesRef}>
          {conversation.length ? (
            <ChatList messages={conversation} />
          ) : (
            <ChatEmpty />
          )}

          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-[50px] w-full border-border border-t-[1px] bg-background">
        <Input
          type="text"
          value={input}
          className="border-none h-12"
          placeholder="Ask Midday a question..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit();
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
