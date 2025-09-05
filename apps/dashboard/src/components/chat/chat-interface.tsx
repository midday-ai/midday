"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useChat } from "@ai-sdk/react";
import type { UIChatMessage } from "@api/ai/types";
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
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, type UIMessage, generateId } from "ai";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import { Overview } from "../overview/overview";
import { ChatHeader } from "./chat-header";

type Props = {
  id?: string;
  initialMessages?: UIChatMessage[];
  initialTitle?: string | null;
  geo?: Geo;
};

export function ChatInterface({
  id: chatId,
  initialMessages,
  initialTitle,
  geo,
}: Props) {
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState<string | undefined>(
    initialTitle || undefined,
  );

  const { data: user } = useUserQuery();
  const pathname = usePathname();

  // Check if we're currently on the root path (no chatId in URL)
  const isOnRootPath = pathname === "/" || pathname === "";

  // Track overview visibility
  const [showOverview, setShowOverview] = useState(isOnRootPath);

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
  } = useChat<UIChatMessage>({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
            message: messages[messages.length - 1],
            country: geo?.country,
            city: geo?.city,
            region: geo?.region,
            timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
      },
    }),
    onData: (dataPart) => {
      // Handle title data parts as they stream in (before main response is done)
      if (dataPart.type === "data-title") {
        // With proper generic typing, TypeScript should know the structure
        // @ts-ignore
        setChatTitle(dataPart.data.title);

        if (typeof document !== "undefined") {
          // @ts-ignore
          document.title = `${dataPart.data.title} | Midday`;
        }
      }
    },
  });

  // Clear messages and title when navigating away
  useEffect(() => {
    if (pathname === "/") {
      setMessages([]);
      setChatTitle(undefined);
      // Show overview header immediately when back on root path
      setShowOverview(true);
    }
  }, [pathname, setMessages]);

  // Hide header immediately when transitioning to chat
  useEffect(() => {
    if (!isOnRootPath && showOverview) {
      // Hide header immediately to trigger animation
      setShowOverview(false);
    }
  }, [isOnRootPath, showOverview]);

  // Update chat title when initialTitle changes (but don't reset to undefined)
  useEffect(() => {
    if (initialTitle) {
      setChatTitle(initialTitle);
    }
  }, [initialTitle]);

  // Set document title when chat title is available
  useEffect(() => {
    if (chatTitle && typeof document !== "undefined") {
      document.title = `${chatTitle} | Midday`;
    }
  }, [chatTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      // Start header animation immediately when user sends first message
      if (isOnRootPath && messages.length === 0 && showOverview) {
        setShowOverview(false);
      }

      // If we're on the root path and this is the first message, update URL
      if (isOnRootPath && messages.length === 0) {
        updateUrl(chatId);
      }

      sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
      setInput("");
    }
  };

  return (
    <div>
      {/* Chat header - instant transition */}
      {!isOnRootPath && <ChatHeader title={chatTitle} />}

      {showOverview && <Overview />}

      {/* Chat content */}
      <div className="w-full mx-auto pb-0 relative size-full h-[calc(100vh-192px)]">
        <div className="flex flex-col h-full">
          <Conversation
            className="h-full w-full pb-20" // Add bottom padding for fixed prompt input
          >
            <ConversationContent className="px-6 max-w-4xl mx-auto">
              {messages.map((message) => {
                // Skip rendering internal/hidden messages
                if (message.metadata?.internal) {
                  return null;
                }

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

                            if (part.type === "tool-getRevenue") {
                              return (
                                <Response
                                  key={`tool-result-${partIndex.toString()}`}
                                >
                                  {part.output}
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

          <div className="fixed bottom-4 left-[70px] right-0 z-20">
            <div className="max-w-[770px] mx-auto w-full bg-[#F7F7F7] dark:bg-[#131313] pt-2">
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
                      <Icons.Add className="size-4" />
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
      </div>
    </div>
  );
}
