"use client";

import { useChat } from "@/hooks/use-chat";
import { useUserQuery } from "@/hooks/use-user";
import { cn } from "@midday/ui/cn";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Icons } from "@midday/ui/icons";
import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { Response } from "@midday/ui/response";
import { Spinner } from "@midday/ui/spinner";
import { useState } from "react";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const { data: user } = useUserQuery();
  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
  } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
      setInput("");
    }
  };

  return (
    <div className="w-full mx-auto pb-0 relative size-full h-[calc(100vh-102px)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full w-full">
          <ConversationContent className="px-6 max-w-4xl mx-auto">
            {messages.map((message) => {
              return (
                <div key={message.id} className="w-full">
                  {message.role !== "system" && (
                    <Message
                      from={message.role}
                      key={message.id}
                      className={cn(
                        "mb-6 w-full",
                        message.role === "assistant" &&
                          "!flex-row !justify-start [&>div]:max-w-full [&>div]:w-full",
                        message.role === "user" &&
                          "!flex-row !justify-end gap-3 [&>div]:max-w-[80%]",
                      )}
                    >
                      <MessageContent
                        className={cn(
                          message.role === "assistant" &&
                            "!bg-transparent !shadow-none !border-none !px-0 !py-0 !rounded-none !text-[#666666]",
                          message.role === "user" &&
                            "!bg-[#131313] !text-primary !px-4 !py-2 max-w-fit rounded-2xl rounded-br-none",
                        )}
                      >
                        {message.parts?.map((part, partIndex) => {
                          if (part.type === "text") {
                            return (
                              <Response key={`text-${partIndex.toString()}`}>
                                {part.text}
                              </Response>
                            );
                          }

                          return null;
                        })}
                      </MessageContent>
                      {message.role === "user" && user && (
                        <MessageAvatar
                          src={user.avatarUrl!}
                          name={user.fullName!}
                        />
                      )}
                    </Message>
                  )}
                </div>
              );
            })}

            {status === "submitted" && <Spinner />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="dark:bg-[#131313] pt-2 max-w-4xl mx-auto w-full">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              maxHeight={30}
              minHeight={30}
              value={input}
              placeholder="Ask me anything"
            />
            <PromptInputToolbar className="pb-1 px-4">
              <PromptInputTools>
                <PromptInputButton className="-ml-2">
                  <Icons.Add className="size-5" />
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                status={status}
                className="mr-0 mb-2"
                size="icon"
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
