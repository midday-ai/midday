"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { useChat } from "@ai-sdk/react";
import { createClient } from "@midday/supabase/client";
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useMemo } from "react";

interface ChatInterfaceProps {
  chatId?: string;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const { data: user } = useUserQuery();
  const trpc = useTRPC();

  // Load existing chat messages if chatId is provided (from route params)
  const existingChat = chatId
    ? useSuspenseQuery(trpc.chats.get.queryOptions({ chatId })).data
    : null;

  console.log("existingChat:", existingChat);
  console.log("initialMessages:", existingChat?.messages || []);

  const authenticatedFetch = useMemo(
    () =>
      Object.assign(
        async (url: RequestInfo | URL, requestOptions?: RequestInit) => {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          return fetch(url, {
            ...requestOptions,
            headers: {
              ...requestOptions?.headers,
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
          });
        },
      ),
    [],
  );
  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
  } = useChat({
    initialMessages: existingChat?.messages || [],
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      // Only send the last message to the server
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
  });

  const updateUrl = (newChatId: string) => {
    // Update URL without navigation using History API
    const newUrl = `/${newChatId}`;
    window.history.pushState({ chatId: newChatId }, "", newUrl);
  };

  const handleNewChat = () => {
    const newChatId = nanoid();
    updateUrl(newChatId);
    // Clear messages for new chat
    setMessages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      // If no chatId exists, create a new chat first
      if (!chatId) {
        const newChatId = nanoid();
        updateUrl(newChatId);
        sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
        setInput("");
        return;
      }

      // If chatId exists, send the message
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
              console.log("Rendering message:", message);
              console.log("Message parts:", message.parts);
              return (
                <div key={message.id} className="w-full">
                  {message.role !== "system" && (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts?.map((part, partIndex) => {
                          console.log("Rendering part:", part);
                          if (part.type === "text") {
                            return (
                              <Response key={`text-${partIndex.toString()}`}>
                                {part.text}
                              </Response>
                            );
                          }

                          return null;
                        }) || (
                          <Response>
                            No parts found for message:{" "}
                            {JSON.stringify(message)}
                          </Response>
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
                <PromptInputButton
                  className="-ml-2"
                  onClick={handleNewChat}
                  title="New chat"
                >
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
