"use client";

import { ThinkingMessage } from "@/components/message";
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
          <ConversationContent className="px-6 mx-auto mb-28 max-w-[770px]">
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

            {status === "submitted" && <ThinkingMessage />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
}
