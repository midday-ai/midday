"use client";

import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import { Response } from "@midday/ui/response";
import type { UIMessage } from "ai";
import { PaperclipIcon } from "lucide-react";
import Image from "next/image";
import { ArtifactToggleIcon } from "@/components/chat/artifact-toggle-icon";
import { ChatMessageActions } from "@/components/chat/chat-message-actions";
import { ConnectBankMessage } from "@/components/chat/connect-bank-message";
import { InsightMessage } from "@/components/chat/insight-message";
import { FaviconStack } from "@/components/favicon-stack";
import { useUserQuery } from "@/hooks/use-user";
import {
  extractArtifactTypeFromMessage,
  extractBankAccountRequired,
  extractInsightData,
} from "@/lib/chat-utils";

interface ChatMessagesProps {
  messages: UIMessage[];
  isStreaming?: boolean;
}

interface SourceItem {
  url: string;
  title: string;
  publishedDate?: string;
}

interface WebSearchToolOutput {
  sources?: SourceItem[];
}

/**
 * Extract sources from webSearch tool results
 * Sources are already deduplicated by the tool
 */
function extractWebSearchSources(parts: UIMessage["parts"]): SourceItem[] {
  const sources: SourceItem[] = [];

  for (const part of parts) {
    const type = part.type as string;
    if (type === "tool-webSearch") {
      const output = (part as { output?: WebSearchToolOutput }).output;
      if (output?.sources) {
        sources.push(...output.sources);
      }
    }
  }

  return sources;
}

/**
 * Extract source-url parts from AI SDK
 */
function extractAiSdkSources(parts: UIMessage["parts"]): SourceItem[] {
  const sources: SourceItem[] = [];

  for (const part of parts) {
    if (part.type === "source-url") {
      const sourcePart = part as { url: string; title?: string };
      sources.push({
        url: sourcePart.url,
        title: sourcePart.title || sourcePart.url,
      });
    }
  }

  return sources;
}

/**
 * Extract file parts from message
 */
function extractFileParts(parts: UIMessage["parts"]) {
  return parts.filter((part) => part.type === "file");
}

export function ChatMessages({
  messages,
  isStreaming = false,
}: ChatMessagesProps) {
  const { data: user } = useUserQuery();

  return (
    <>
      {messages.map(({ parts, ...message }, index) => {
        // Extract text parts
        const textParts = parts.filter((part) => part.type === "text");
        const textContent = textParts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");

        // Extract file parts
        const fileParts = extractFileParts(parts);

        // Extract sources from AI SDK and webSearch
        const aiSdkSources = extractAiSdkSources(parts);

        // Extract sources from webSearch tool results (already deduplicated)
        const webSearchSources = extractWebSearchSources(parts);

        // Combine sources and deduplicate between AI SDK and webSearch sources
        const allSources = [...aiSdkSources, ...webSearchSources];
        const uniqueSources = allSources.filter(
          (source, index, self) =>
            index === self.findIndex((s) => s.url === source.url),
        );

        // Check if bank account is required
        const bankAccountRequired = extractBankAccountRequired(parts);

        // Check if this is an insight response
        const insightData =
          message.role === "assistant" ? extractInsightData(parts) : null;

        // Extract artifact type from message parts
        const artifactType =
          message.role === "assistant"
            ? extractArtifactTypeFromMessage(parts)
            : null;

        // Check if this is the last (currently streaming) message
        const isLastMessage = index === messages.length - 1;

        // Message is finished if it's not the last message, or if it's the last message and not streaming
        const isMessageFinished = !isLastMessage || !isStreaming;

        // Show sources only after response is finished (not on the currently streaming message)
        const shouldShowSources =
          uniqueSources.length > 0 &&
          message.role === "assistant" &&
          isMessageFinished;

        return (
          <div key={message.id} className="group">
            {/* Render file attachments */}
            {fileParts.length > 0 && (
              <Message from={message.role}>
                <MessageContent className="max-w-[80%]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {fileParts.map((part) => {
                      if (part.type !== "file") return null;

                      const file = part as {
                        type: "file";
                        url?: string;
                        mediaType?: string;
                        filename?: string;
                      };

                      // Create a unique key from file properties
                      const fileKey = `${file.url}-${file.filename}`;
                      const isImage = file.mediaType?.startsWith("image/");

                      if (isImage && file.url) {
                        return (
                          <div
                            key={fileKey}
                            className="relative rounded-lg border overflow-hidden"
                          >
                            <Image
                              src={file.url}
                              alt={file.filename || "attachment"}
                              className="max-w-xs max-h-48 object-cover"
                              width={300}
                              height={192}
                              unoptimized
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={fileKey}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50"
                        >
                          <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {file.filename || "Unknown file"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </MessageContent>
                {message.role === "user" && user && (
                  <MessageAvatar
                    src={user.avatarUrl || ""}
                    name={user.fullName || user.email || ""}
                  />
                )}
              </Message>
            )}

            {/* Render bank account required message */}
            {bankAccountRequired && message.role === "assistant" && (
              <Message from={message.role}>
                <MessageContent className="max-w-[80%]">
                  <ConnectBankMessage />
                </MessageContent>
              </Message>
            )}

            {/* Render insight as a dedicated component - full width */}
            {insightData &&
              message.role === "assistant" &&
              !bankAccountRequired && (
                <Message from={message.role}>
                  <MessageContent className="!max-w-full w-full">
                    <InsightMessage insight={insightData} />
                  </MessageContent>
                </Message>
              )}

            {/* Render text content in message (skip if we rendered insight) */}
            {textParts.length > 0 && !bankAccountRequired && !insightData && (
              <Message from={message.role}>
                <MessageContent className="max-w-[80%]">
                  <Response>{textContent}</Response>
                </MessageContent>
                {message.role === "user" && user && (
                  <MessageAvatar
                    src={user.avatarUrl || ""}
                    name={user.fullName || user.email || ""}
                  />
                )}
              </Message>
            )}

            {/* Render sources as stacked favicons - show immediately when available */}
            {shouldShowSources && !bankAccountRequired && (
              <div className="max-w-[80%]">
                <FaviconStack sources={uniqueSources} />
              </div>
            )}

            {/* Render message actions and artifact toggle for assistant messages when finished */}
            {message.role === "assistant" &&
              isMessageFinished &&
              (textContent || insightData) &&
              !bankAccountRequired && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center gap-1 mt-3">
                    {/* Message actions */}
                    <ChatMessageActions
                      messageContent={textContent}
                      messageId={message.id}
                      insightId={insightData?.id}
                    />
                    {/* Artifact toggle icon */}
                    {artifactType && (
                      <ArtifactToggleIcon artifactType={artifactType} />
                    )}
                  </div>
                </div>
              )}
          </div>
        );
      })}
    </>
  );
}
