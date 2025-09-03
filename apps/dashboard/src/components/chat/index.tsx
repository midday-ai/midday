"use client";

import { useChat } from "@ai-sdk/react";
import { createClient } from "@midday/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Loader } from "@midday/ui/loader";
import { Message, MessageContent } from "@midday/ui/message";
import { PromptInput, PromptInputTextarea } from "@midday/ui/prompt-input";
import { Response } from "@midday/ui/response";
import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");
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
      { preconnect: () => {} },
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
    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-68px)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => {
              console.log(message);
              return (
                <div key={message.id}>
                  {message.role !== "data" && (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
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
                    </Message>
                  )}
                </div>
              );
            })}
            {isLoading && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </PromptInput>
      </div>
    </div>
  );
}
