"use client";

import {
  MessageSpecRenderer,
  useJsonRenderMessage,
} from "@midday/generative-ui/renderer";
import { Message, MessageAvatar, MessageContent } from "@midday/ui/message";
import { Response } from "@midday/ui/response";
import type { UIMessage } from "ai";
import { PaperclipIcon } from "lucide-react";
import Image from "next/image";
import { ChatMessageActions } from "@/components/chat/chat-message-actions";
import { ConnectBankMessage } from "@/components/chat/connect-bank-message";
import { InsightMessage } from "@/components/chat/insight-message";
import { FaviconStack } from "@/components/favicon-stack";
import { useUserQuery } from "@/hooks/use-user";
import {
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

function extractFileParts(parts: UIMessage["parts"]) {
  return parts.filter((part) => part.type === "file");
}

interface ChatMessageBubbleProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}

function ChatMessageBubble({
  message,
  isLastMessage,
  isStreaming,
}: ChatMessageBubbleProps) {
  const { data: user } = useUserQuery();
  const { parts } = message;

  const { text, hasSpec } = useJsonRenderMessage(parts);

  const textParts = parts.filter((part) => part.type === "text");
  const textContent =
    text ||
    textParts.map((part) => (part.type === "text" ? part.text : "")).join("");

  const fileParts = extractFileParts(parts);

  const aiSdkSources = extractAiSdkSources(parts);
  const webSearchSources = extractWebSearchSources(parts);
  const allSources = [...aiSdkSources, ...webSearchSources];
  const uniqueSources = allSources.filter(
    (source, idx, self) => idx === self.findIndex((s) => s.url === source.url),
  );

  const bankAccountRequired = extractBankAccountRequired(parts);
  const insightData =
    message.role === "assistant" ? extractInsightData(parts) : null;
  const isMessageFinished = !isLastMessage || !isStreaming;
  const shouldShowSources =
    uniqueSources.length > 0 &&
    message.role === "assistant" &&
    isMessageFinished;

  return (
    <div className="group">
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

      {bankAccountRequired && message.role === "assistant" && (
        <Message from={message.role}>
          <MessageContent className="max-w-[80%]">
            <ConnectBankMessage />
          </MessageContent>
        </Message>
      )}

      {insightData && message.role === "assistant" && !bankAccountRequired && (
        <Message from={message.role}>
          <MessageContent className="!max-w-full w-full">
            <InsightMessage insight={insightData} />
          </MessageContent>
        </Message>
      )}

      {textContent && !bankAccountRequired && !insightData && (
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

      {hasSpec && message.role === "assistant" && !bankAccountRequired && (
        <Message from="assistant">
          <MessageContent className="!max-w-full w-full">
            <MessageSpecRenderer parts={parts} />
          </MessageContent>
        </Message>
      )}

      {shouldShowSources && !bankAccountRequired && (
        <div className="max-w-[80%]">
          <FaviconStack sources={uniqueSources} />
        </div>
      )}

      {message.role === "assistant" &&
        isMessageFinished &&
        (textContent || insightData || hasSpec) &&
        !bankAccountRequired && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 mt-3">
              <ChatMessageActions
                messageContent={textContent}
                messageId={message.id}
                insightId={insightData?.id}
              />
            </div>
          </div>
        )}
    </div>
  );
}

export function ChatMessages({
  messages,
  isStreaming = false,
}: ChatMessagesProps) {
  return (
    <>
      {messages.map((message, index) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          isLastMessage={index === messages.length - 1}
          isStreaming={isStreaming}
        />
      ))}
    </>
  );
}
