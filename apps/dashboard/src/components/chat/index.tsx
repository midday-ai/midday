"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useAssistantStore } from "@/store/assistant";
import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";
import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { ChatFooter } from "./chat-footer";
import { ChatInput } from "./chat-input";
import { Messages } from "./messages";

export function Chat() {
  const { message } = useAssistantStore();

  const { messages, input, handleSubmit, status, setInput, append } = useChat({
    experimental_throttle: 100,
    sendExtraMessageFields: true,
  });

  const { data: user } = useUserQuery();

  const showExamples = messages.length === 0 && !input;

  const handleExampleSubmit = (example: string) => {
    append({ role: "user", content: example });
    handleSubmit();
  };

  useEffect(() => {
    if (message) {
      append({ role: "user", content: message });
      handleSubmit();
    }
  }, [message]);

  return (
    <div className="relative">
      <div className="todesktop:h-[335px] md:h-[335px]">
        {messages.length ? (
          <Messages status={status} messages={messages} />
        ) : (
          <ChatEmpty firstName={user?.full_name?.split(" ").at(0) ?? ""} />
        )}
      </div>
      <div className="fixed bottom-[1px] left-[1px] right-[1px] todesktop:h-[88px] md:h-[88px] bg-background border-border border-t-[1px]">
        {showExamples && <ChatExamples handleSubmit={handleExampleSubmit} />}

        <ChatInput
          handleSubmit={handleSubmit}
          input={input}
          setInput={setInput}
        />

        <ChatFooter handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
