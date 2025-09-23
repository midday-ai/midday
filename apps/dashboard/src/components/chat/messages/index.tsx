"use client";

import { MessageActions } from "@/components/chat/messages/message-actions";
import { ActiveToolCall, ThinkingMessage } from "@/components/message";
import { WebSearchSources } from "@/components/web-search-sources";
import { useUserQuery } from "@/hooks/use-user";
import { useChatMessages, useChatStatus } from "@ai-sdk-tools/store";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@midday/ui/conversation";
import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import { Response } from "@midday/ui/response";
import { Fragment } from "react";

export function Messages() {
  const messages = useChatMessages();
  const status = useChatStatus();
  const { data: user } = useUserQuery();

  return (
    <div className="w-full mx-auto relative size-full h-[calc(100vh-86px)] pb-28">
      <div className="flex flex-col h-full w-full">
        <Conversation className="h-full w-full">
          <ConversationContent className="px-6 mx-auto mb-40 max-w-[770px]">
            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "data-canvas":
                      return null; // Canvas content is rendered in sidebar

                    case "text":
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
                            </MessageContent>

                            {message.role === "user" && user && (
                              <MessageAvatar
                                src={user.avatarUrl!}
                                name={user.fullName!}
                              />
                            )}
                          </Message>

                          {message.role === "assistant" &&
                            message.parts.filter(
                              (part) => part.type === "source-url",
                            ).length > 0 && (
                              <WebSearchSources
                                sources={message.parts.filter(
                                  (part) => part.type === "source-url",
                                )}
                              />
                            )}

                          {message.role === "assistant" &&
                            status !== "streaming" && (
                              <MessageActions
                                messageContent={part.text}
                                messageId={message.id}
                              />
                            )}
                        </Fragment>
                      );

                    default: {
                      if (part.type.startsWith("tool-")) {
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.output?.text}</Response>
                              </MessageContent>
                            </Message>
                          </Fragment>
                        );
                      }

                      return null;
                    }
                  }
                })}
              </div>
            ))}

            {status === "submitted" && <ThinkingMessage />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
}
