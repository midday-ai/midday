"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useChat } from "@ai-sdk/react";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Icons } from "@midday/ui/icons";
import { Loader } from "@midday/ui/loader";
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
import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");
  const { data: user } = useUserQuery();
  const { messages, append, isLoading } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
    headers: {
      "Content-Type": "application/json",
    },
    fetch: Object.assign(
      async (url: RequestInfo | URL, options?: RequestInit) => {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
      },
    ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      append({ role: "user", content: input });
      setInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-0 relative size-full h-[calc(100vh-102px)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent className="px-6">
            {messages.map((message) => {
              console.log(message);
              return (
                <div key={message.id}>
                  {message.role !== "data" && (
                    <Message
                      from={message.role}
                      key={message.id}
                      className={cn(
                        "mb-6",
                        message.role === "assistant" &&
                          "!flex-row !justify-start [&>div]:max-w-full",
                        message.role === "user" &&
                          "!flex-row !justify-end gap-3 [&>div]:max-w-[80%]",
                      )}
                    >
                      <MessageContent
                        className={cn(
                          message.role === "assistant" &&
                            "!bg-transparent !shadow-none !border-none !px-0 !py-0 !rounded-none",
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

                          if (part.type === "tool-invocation") {
                            const toolPart = part as any; // Type assertion for tool invocation
                            return (
                              <div
                                key={`tool-${partIndex.toString()}`}
                                className="mt-4 p-4 border border-border rounded-lg bg-muted/50"
                              >
                                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  {toolPart.toolName === "getRevenue" && "💰"}
                                  {toolPart.toolName !== "getRevenue" && "🔧"}
                                  {toolPart.toolName === "getRevenue"
                                    ? "Revenue Data"
                                    : toolPart.toolName}
                                </div>

                                {toolPart.state === "call" && (
                                  <div className="text-sm text-muted-foreground">
                                    <div className="animate-pulse">
                                      Fetching data...
                                    </div>
                                  </div>
                                )}

                                {toolPart.state === "result" && (
                                  <div className="whitespace-pre-wrap text-sm font-mono bg-background p-3 rounded border">
                                    {typeof toolPart.result === "string"
                                      ? toolPart.result
                                      : JSON.stringify(
                                          toolPart.result,
                                          null,
                                          2,
                                        )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return null;
                        })}

                        {/* Fallback for message.content if no parts */}
                        {!message.parts?.length && (
                          <Response>{message.content}</Response>
                        )}
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
            {isLoading && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="dark:bg-[#131313] pt-2 max-w-3xl mx-auto w-full">
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
                status={isLoading ? "submitted" : undefined}
                className="mr-0 mb-2"
                size="icon"
              >
                <Icons.ArrowUpward className="size-4" />
              </PromptInputSubmit>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
