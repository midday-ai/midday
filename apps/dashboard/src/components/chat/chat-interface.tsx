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
import { DefaultChatTransport, type UIMessage, generateId } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import { ChatHeader } from "./chat-header";

// Define message metadata type for chat titles
type ChatMessageMetadata = {
  title?: string;
  isFirstMessage?: boolean;
  chatId?: string;
};

// Define data part types for streaming title data
type ChatDataParts = {
  "data-title": {
    title: string;
  };
};

type ChatUIMessage = UIMessage<ChatMessageMetadata, ChatDataParts>;

interface ChatInterfaceProps {
  id?: string;
  initialMessages?: UIMessage[];
}

export function ChatInterface({ id, initialMessages }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const { data: user } = useUserQuery();
  const pathname = usePathname();
  const router = useRouter();

  const chatId = useMemo(() => id ?? generateId(), [id]);

  // Check if we're currently on the root path (no chatId in URL)
  const isOnRootPath = pathname === "/" || pathname === "";

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

  const updateUrl = (chatId?: string) => {
    window.history.pushState({ chatId }, "", `/${chatId}`);
  };

  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    status,
    error,
  } = useChat<ChatUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onData: (dataPart) => {
      // Handle title data parts as they stream in (before main response is done)
      if (dataPart.type === "data-title") {
        const titleData = dataPart.data;
        setChatTitle(titleData.title);

        if (typeof document !== "undefined") {
          document.title = `${titleData.title} | Midday`;
        }
      }
    },
  });

  // Clear messages and title when navigating away
  useEffect(() => {
    if (pathname === "/") {
      setMessages([]);
      setChatTitle(null);
    }
  }, [pathname, setMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      // If we're on the root path and this is the first message, update URL
      if (isOnRootPath && messages.length === 0) {
        updateUrl(chatId);
      }

      sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
      setInput("");
    }
  };

  return (
    <div className="w-full mx-auto pb-0 relative size-full h-[calc(100vh-102px)]">
      <div className="flex flex-col h-full">
        <ChatHeader title={chatTitle} />

        <Conversation className="h-full w-full">
          <ConversationContent className="px-6 max-w-4xl mx-auto">
            {messages.map((message) => {
              return (
                <div key={message.id} className="w-full">
                  {message.role !== "system" && (
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

        <div className="bg-[#F7F7F7] dark:bg-[#131313] pt-2 max-w-4xl mx-auto w-full">
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
