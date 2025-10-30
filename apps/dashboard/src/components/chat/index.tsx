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
            {messages.map((message) => (
              <div key={message.id}>
                {/* {message.role === "assistant" && (
                  <Sources>
                    <SourcesTrigger count={0} />
                  </Sources>
                )} */}
                {message.role !== "data" && (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      <Response>{message.content}</Response>
                    </MessageContent>
                  </Message>
                )}
              </div>
            ))}
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
