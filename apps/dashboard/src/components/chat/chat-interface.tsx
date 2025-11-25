"use client";

import { Canvas } from "@/components/canvas";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatStatus } from "@/hooks/use-chat-status";
import { useChat, useChatActions, useDataPart } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@midday/api/ai/types";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, generateId } from "ai";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef } from "react";
import {
  ChatHeader,
  ChatInput,
  type ChatInputMessage,
  ChatMessages,
  ChatStatusIndicators,
} from "./";

type Props = {
  geo?: Geo;
};

export function ChatInterface({ geo }: Props) {
  const { chatId: routeChatId, isHome } = useChatInterface();
  const chatId = useMemo(() => routeChatId ?? generateId(), [routeChatId]);
  const { reset } = useChatActions();
  const prevChatIdRef = useRef<string | null>(routeChatId);
  const [, clearSuggestions] = useDataPart<{ prompts: string[] }>(
    "suggestions",
  );

  // Reset chat state when navigating away from a chat (sidebar, browser back, etc.)
  useEffect(() => {
    const prevChatId = prevChatIdRef.current;
    const currentChatId = routeChatId;

    // If we had a chatId before and now we don't (navigated away), reset
    // Or if we're switching to a different chatId, reset
    if (prevChatId && prevChatId !== currentChatId) {
      reset();
      clearSuggestions();
    }

    // Update the ref for next comparison
    prevChatIdRef.current = currentChatId;
  }, [routeChatId, reset, clearSuggestions]);

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

  const { messages, status } = useChat<UIChatMessage>({
    id: chatId,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages, id }) {
        const lastMessage = messages[messages.length - 1] as ChatInputMessage;

        const agentChoice = lastMessage.metadata?.agentChoice;
        const toolChoice = lastMessage.metadata?.toolChoice;

        return {
          body: {
            id,
            country: geo?.country,
            city: geo?.city,
            message: lastMessage,
            agentChoice,
            toolChoice,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
      },
    }),
  });

  const {
    agentStatus,
    currentToolCall,
    artifactStage,
    artifactType,
    currentSection,
    bankAccountRequired,
  } = useChatStatus(messages, status);

  const [selectedType, setSelectedType] = useQueryState(
    "artifact-type",
    parseAsString,
  );

  const hasMessages = messages.length > 0;

  const [suggestions] = useDataPart<{ prompts: string[] }>("suggestions");
  const hasSuggestions = suggestions?.prompts && suggestions.prompts.length > 0;
  const showCanvas = Boolean(selectedType);

  return (
    <div
      className={cn(
        "relative flex size-full",
        isHome && "h-[calc(100vh-764px)] chat-interface-container-scrollable",
        !isHome && "h-[calc(100vh-88px)] overflow-hidden",
      )}
    >
      {/* Canvas slides in from right when artifacts are present */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-20",
          showCanvas ? "translate-x-0" : "translate-x-full",
          hasMessages && "transition-transform duration-300 ease-in-out",
          "md:z-20 z-40",
        )}
      >
        <Canvas />
      </div>

      {/* Main chat area - container that slides left when canvas opens */}
      <div
        className={cn(
          "relative flex-1",
          hasMessages && "transition-all duration-300 ease-in-out",
          showCanvas && "mr-0 md:mr-[600px]",
          !hasMessages && "flex items-center justify-center",
        )}
      >
        {hasMessages && (
          <>
            {/* Conversation view - messages with absolute positioning for proper height */}
            <div className="absolute inset-0 flex flex-col">
              <div
                className={cn(
                  "sticky top-0 left-0 z-10 shrink-0",
                  hasMessages && "transition-all duration-300 ease-in-out",
                  showCanvas ? "right-0 md:right-[600px]" : "right-0",
                )}
              >
                <div className="bg-background/80 dark:bg-background/50 backdrop-blur-sm pt-6">
                  <ChatHeader />
                </div>
              </div>
              <Conversation>
                <ConversationContent className="pb-48 pt-14">
                  <div className="max-w-2xl mx-auto w-full">
                    <ChatMessages
                      messages={messages}
                      isStreaming={
                        status === "streaming" || status === "submitted"
                      }
                    />
                    <ChatStatusIndicators
                      agentStatus={agentStatus}
                      currentToolCall={currentToolCall}
                      status={status}
                      artifactStage={artifactStage}
                      artifactType={artifactType}
                      currentSection={currentSection}
                      bankAccountRequired={bankAccountRequired}
                    />
                  </div>
                </ConversationContent>
                <ConversationScrollButton
                  className={cn(hasSuggestions ? "bottom-40" : "bottom-32")}
                />
              </Conversation>
            </div>
          </>
        )}

        <div
          className={cn(
            "fixed bottom-0 left-0",
            hasMessages && "transition-all duration-300 ease-in-out",
            showCanvas ? "right-0 md:right-[600px]" : "right-0",
            isHome && "chat-input-wrapper-static",
          )}
        >
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
