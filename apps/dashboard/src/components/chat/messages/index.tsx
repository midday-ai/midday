"use client";

import { MessageActions } from "@/components/chat/messages/message-indicators";
import { ActiveToolCall, ThinkingMessage } from "@/components/message";
import {
  WebSearchSources,
  extractWebSearchSources,
} from "@/components/web-search-sources";
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
                {/* {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )} */}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "data-data-canvas":
                      return null; // Canvas content is rendered in sidebar

                    case "text":
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" &&
                            i === messages.length - 1 && (
                              // <Actions className="mt-2">
                              //   <Action
                              //     onClick={() => regenerate()}
                              //     label="Retry"
                              //   >
                              //     <RefreshCcwIcon className="size-3" />
                              //   </Action>
                              //   <Action
                              //     onClick={() =>
                              //       navigator.clipboard.writeText(part.text)
                              //     }
                              //     label="Copy"
                              //   >
                              //     <CopyIcon className="size-3" />
                              //   </Action>
                              // </Actions>
                              <MessageActions />
                            )}
                        </Fragment>
                      );
                    // case 'reasoning':
                    //   return (
                    //     <Reasoning
                    //       key={`${message.id}-${i}`}
                    //       className="w-full"
                    //       isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                    //     >
                    //       <ReasoningTrigger />
                    //       <ReasoningContent>{part.text}</ReasoningContent>
                    //     </Reasoning>
                    //   );
                    // case "tool-getTransactions":
                    //   return (
                    //     <Fragment key={`${message.id}-${i}`}>
                    //       <Message from={message.role}>
                    //         <MessageContent>
                    //           <Response>{part.output as string}</Response>
                    //         </MessageContent>
                    //       </Message>
                    //     </Fragment>
                    //   );
                    default: {
                      if (part.type?.startsWith("tool-")) {
                        console.log(part);
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.output as string}</Response>
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
