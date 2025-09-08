"use client";

import { ChatCanvas } from "@/components/chat/chat-canvas";
import { ChatHeader } from "@/components/chat/chat-header";
import { ActiveToolCall, ThinkingMessage } from "@/components/message";
import { Overview } from "@/components/overview/overview";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { useChat } from "@ai-sdk/react";
import type { MessageDataParts, ToolName } from "@api/ai/tools/registry";
import type { UIChatMessage } from "@api/ai/types";
import { createClient } from "@midday/supabase/client";
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
import { useQueryClient } from "@tanstack/react-query";
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, generateId } from "ai";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMemo } from "react";

type Props = {
  id?: string;
  initialMessages?: UIChatMessage[];
  initialTitle?: string | null;
  geo?: Geo;
};

export function ChatInterface({
  id,
  initialMessages,
  initialTitle,
  geo,
}: Props) {
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState<string | undefined>(
    initialTitle || undefined,
  );

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data: user } = useUserQuery();
  const pathname = usePathname();

  // Generate a consistent chat ID - use provided ID or generate one
  const chatId = useMemo(() => id ?? generateId(), [id]);

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

  const { messages, sendMessage, setMessages, status } = useChat<UIChatMessage>(
    {
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

          //  Invalidate chats list
          queryClient.invalidateQueries({
            queryKey: trpc.chats.list.queryKey(),
          });
        }
      },
    },
  );

  // Extract canvas data and titles from message parts (automatically persisted by AI SDK)
  const { canvasData, canvasTitle, hasCanvasContent } = useMemo(() => {
    const canvasParts: MessageDataParts["data-canvas"][] = [];
    let title: string | undefined;

    for (const message of messages) {
      if (message.parts) {
        for (const part of message.parts) {
          // Check if this is a canvas-related data part
          if ((part as any).type === "data-canvas-title") {
            title = (part as any).data?.title;
          } else if ((part as any).type === "data-canvas") {
            canvasParts.push((part as any).data);
          }
        }
      }
    }

    return {
      canvasData: canvasParts,
      canvasTitle: title,
      hasCanvasContent: canvasParts.length > 0 || !!title,
    };
  }, [messages]);

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

  const handleToolCall = ({
    toolName,
    toolParams,
    text,
  }: { toolName: string; toolParams: Record<string, any>; text: string }) => {
    // Start header animation immediately when user sends first message
    if (isOnRootPath && messages.length === 0 && showOverview) {
      setShowOverview(false);
    }

    // If we're on the root path and this is the first message, update URL
    if (isOnRootPath && messages.length === 0) {
      updateUrl(chatId);
    }

    sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
      metadata: {
        internal: true,
        toolCall: {
          toolName,
          toolParams,
        },
      },
    });
  };

  return (
    <div className="relative h-full overflow-hidden">
      {/* Header stays fixed but content slides with canvas */}
      <ChatHeader title={chatTitle} hasCanvas={hasCanvasContent} />

      {/* Main chat container - slides to the left when canvas appears */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-in-out w-full",
          hasCanvasContent ? "-translate-x-[300px]" : "translate-x-0",
        )}
      >
        {showOverview && (
          <div className="pt-20">
            <Overview handleToolCall={handleToolCall} />
          </div>
        )}

        {/* Chat content - account for header height */}
        <div
          className={cn(
            "w-full mx-auto pb-0 relative size-full h-[calc(100vh-86px)] pt-20", // Add padding-top for header space
            showOverview && "h-[calc(100vh-660px)]",
          )}
        >
          <div className="flex flex-col h-full w-full">
            <Conversation className="h-full w-full">
              <ConversationContent className="px-6 mx-auto mt-16 mb-28 max-w-[770px]">
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
                              // Handle canvas data parts in messages
                              if ((part as any).presentation === "canvas") {
                                // Canvas data is automatically extracted via useMemo
                                // Don't render canvas parts in the message - they go to the sidebar
                                return null;
                              }

                              if (part.type?.startsWith("tool-")) {
                                // Check if tool output should be displayed
                                const toolOutput = (part as any).output;
                                const shouldHide =
                                  toolOutput?.display === "hidden";

                                if (shouldHide) {
                                  // Check if this message has text content - if so, don't show the pill
                                  const hasTextContent = message.parts?.some(
                                    (p) => p.type === "text" && p.text?.trim(),
                                  );

                                  if (hasTextContent) {
                                    return null; // Hide pill when we have AI analysis
                                  }

                                  const toolName = part.type.replace(
                                    "tool-",
                                    "",
                                  ) as ToolName | "web_search_preview";

                                  return (
                                    <ActiveToolCall
                                      key={`tool-call-${partIndex.toString()}`}
                                      toolName={toolName}
                                    />
                                  );
                                }

                                // Show full tool output for tools that want to be displayed
                                return (
                                  <Response
                                    key={`tool-result-${partIndex.toString()}`}
                                  >
                                    {toolOutput?.content || toolOutput}
                                  </Response>
                                );
                              }

                              if (part.type === "text") {
                                return (
                                  <Response
                                    key={`text-${partIndex.toString()}`}
                                  >
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

                {status === "submitted" &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "user" && (
                    <ThinkingMessage />
                  )}
              </ConversationContent>
              <ConversationScrollButton
                className={cn(
                  hasCanvasContent && "left-[calc(50%-150px)]", // Adjust position when canvas is open
                )}
              />
            </Conversation>

            <div className="absolute bottom-4 left-0 right-0 z-20 px-6">
              <div className="mx-auto w-full bg-[#F7F7F7] dark:bg-[#131313] pt-2 max-w-[770px]">
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

      {/* Canvas overlay - slides in from right */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full transition-all duration-300 ease-in-out overflow-hidden border-l z-30 bg-background",
          hasCanvasContent
            ? "w-[600px] opacity-100 translate-x-0"
            : "w-[600px] opacity-0 translate-x-full",
        )}
      >
        {hasCanvasContent && (
          <ChatCanvas
            canvasData={canvasData}
            canvasTitle={canvasTitle}
            onClose={() => {
              // Remove all canvas-related data parts from messages
              const updatedMessages = messages.map((message) => ({
                ...message,
                parts: message.parts?.filter(
                  (part: any) =>
                    part.type !== "data-canvas" &&
                    part.type !== "data-canvas-title",
                ),
              }));
              setMessages(updatedMessages);
            }}
          />
        )}
      </div>
    </div>
  );
}
