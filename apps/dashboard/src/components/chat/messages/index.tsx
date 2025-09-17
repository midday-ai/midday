"use client";

import { ActiveToolCall, ThinkingMessage } from "@/components/message";
import { useUserQuery } from "@/hooks/use-user";
import { useChatMessages, useChatProperty } from "@ai-sdk-tools/store";
import type { ToolName } from "@api/ai/tools/registry";
import { cn } from "@midday/ui/cn";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import { Response } from "@midday/ui/response";

export function Messages() {
  const messages = useChatMessages();
  const { data: user } = useUserQuery();

  return (
    <div
      className={cn(
        "w-full mx-auto pb-0 relative size-full h-[calc(100vh-86px)]",
        // showOverview && "h-[calc(100vh-677px)]",
      )}
    >
      <div className="flex flex-col h-full w-full">
        <Conversation className="h-full w-full">
          <ConversationContent className="px-6 mx-auto mt-16 mb-28 max-w-[770px]">
            {messages.map((message) => {
              // Skip rendering internal/hidden messages
              if ((message.metadata as any)?.internal) {
                return null;
              }

              return (
                <div key={message.id} className="w-full">
                  {message.role !== "system" && (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts?.map((part, partIndex) => {
                          // Canvas parts are handled by the canvas sidebar, not rendered inline
                          if (part.type === "data-data-canvas") {
                            return null; // Canvas content is rendered in sidebar
                          }

                          if (part.type?.startsWith("tool-")) {
                            // Handle expense tool specifically for generative UI

                            // Check if tool output should be displayed (existing logic)
                            const toolOutput = (part as any).output;
                            const shouldHide = toolOutput?.display === "hidden";

                            if (shouldHide) {
                              // Check if this message has text content - if so, don't show the pill
                              const hasTextContent = message.parts?.some(
                                (p) => p.type === "text" && p.text?.trim(),
                              );

                              if (hasTextContent) {
                                return null; // Hide pill when we have AI analysis
                              }

                              const toolName = part.type.replace("tool-", "") as
                                | ToolName
                                | "web_search_preview";

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

            {/* Optimized thinking message display */}
            {useChatProperty(
              (state) =>
                state.status === "submitted" &&
                state.messages.length > 0 &&
                state.messages[state.messages.length - 1]?.role === "user",
            ) && <ThinkingMessage />}
          </ConversationContent>
          <ConversationScrollButton
          // className={cn(
          //   hasCanvasContent && "left-[calc(50%-150px)]", // Adjust position when canvas is open
          // )}
          />
        </Conversation>
      </div>
    </div>
  );
}
