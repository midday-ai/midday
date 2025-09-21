"use client";

import { MessageActions } from "@/components/chat/messages/message-indicators";
import { ActiveToolCall, ThinkingMessage } from "@/components/message";
import { useUserQuery } from "@/hooks/use-user";
import { useChatMessages, useChatStatus } from "@ai-sdk-tools/store";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import { Response } from "@midday/ui/response";

export function Messages() {
  const messages = useChatMessages();
  const status = useChatStatus();
  const { data: user } = useUserQuery();

  return (
    <div className="w-full mx-auto relative size-full h-[calc(100vh-86px)] pb-28">
      <div className="flex flex-col h-full w-full">
        <Conversation className="h-full w-full">
          <ConversationContent className="px-6 mx-auto mb-40 max-w-[770px]">
            {messages.map((message, messageIndex) => {
              const isLastMessage = messageIndex === messages.length - 1;

              return (
                <div key={message.id} className="w-full">
                  {message.role !== "system" && (
                    <>
                      <Message from={message.role} key={message.id}>
                        <MessageContent>
                          {message.parts?.map((part, partIndex) => {
                            // Canvas parts are handled by the canvas sidebar, not rendered inline
                            if (part.type === "data-data-canvas") {
                              return null; // Canvas content is rendered in sidebar
                            }

                            if (part.type?.startsWith("tool-")) {
                              const toolOutput = (part as any).output;
                              // Extract tool name from part.type (e.g., "tool-getBurnRate" -> "getBurnRate")
                              const toolName = part.type.replace("tool-", "");

                              // Show tool call indicator if no output yet (tool is still running)
                              if (toolName && !toolOutput) {
                                return (
                                  <ActiveToolCall
                                    key={`tool-call-${partIndex.toString()}`}
                                    toolName={toolName}
                                  />
                                );
                              }

                              // Show full tool output for tools that want to be displayed
                              if (toolOutput) {
                                return (
                                  <Response
                                    key={`tool-result-${partIndex.toString()}`}
                                  >
                                    {toolOutput?.content || toolOutput}
                                  </Response>
                                );
                              }
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

                      {message.role === "assistant" &&
                        (!isLastMessage ||
                          (isLastMessage && status !== "streaming")) && (
                          <MessageActions />
                        )}
                    </>
                  )}
                </div>
              );
            })}

            {status === "submitted" && <ThinkingMessage />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
}
