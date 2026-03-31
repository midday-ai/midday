"use client";

import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { ChatInvoiceCard } from "./chat-invoice-card";
import { extractInvoiceData, parseAssistantMessage } from "./chat-utils";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { SourcesList } from "./sources-list";
import {
  makeStreamdownComponents,
  streamdownClassName,
  streamdownControls,
  streamdownIcons,
} from "./streamdown-config";
import { ThinkingIndicator } from "./thinking-indicator";
import { ToolCallGroup } from "./tool-call-group";

type ChatMessagesProps = {
  messages: UIMessage[];
  status: string;
  onInvoiceUpdate?: (invoiceId: string) => void;
  canvasOpen?: boolean;
};

export function ChatMessages({
  messages,
  status,
  onInvoiceUpdate,
  canvasOpen,
}: ChatMessagesProps) {
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setInboxParams } = useInboxParams();
  const { setParams: setDocumentParams } = useDocumentParams();
  const { setParams: setConnectParams } = useConnectParams();
  const router = useRouter();

  const handleEntityLink = useCallback((href: string) => {
    if (href === "#connect:bank") {
      setConnectParams({ step: "connect" });
      return true;
    }
    if (href.startsWith("#navigate:")) {
      router.push(href.slice(10));
      return true;
    }
    if (href.startsWith("#txn:")) {
      setTransactionParams({ transactionId: href.slice(5) });
      return true;
    }
    if (href.startsWith("#inv:")) {
      setInvoiceParams({ invoiceId: href.slice(5), type: "details" });
      return true;
    }
    if (href.startsWith("#cust:")) {
      setCustomerParams({ customerId: href.slice(6), details: true });
      return true;
    }
    if (href.startsWith("#project:")) {
      setTrackerParams({ projectId: href.slice(9), update: true });
      return true;
    }
    if (href.startsWith("#inbox:")) {
      setInboxParams({ inboxId: href.slice(7), type: "details" });
      return true;
    }
    if (href.startsWith("#doc:")) {
      setDocumentParams({ documentId: href.slice(5) });
      return true;
    }
    return false;
  }, []);

  const components = useCallback(
    () => makeStreamdownComponents(handleEntityLink),
    [handleEntityLink],
  );

  const lastEmittedRef = useRef<{ id: string | null; count: number }>({
    id: null,
    count: 0,
  });

  useEffect(() => {
    if (!onInvoiceUpdate) return;

    let latestInvoiceId: string | null = null;
    let invoiceCount = 0;
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const parsed = parseAssistantMessage(message, {
        isStreaming: false,
        isLastMessage: false,
      });
      for (const part of parsed.invoiceParts) {
        const data = extractInvoiceData(part.output);
        const id = data?.id as string | undefined;
        if (id) {
          latestInvoiceId = id;
          invoiceCount++;
        }
      }
    }

    if (
      latestInvoiceId &&
      (latestInvoiceId !== lastEmittedRef.current.id ||
        invoiceCount !== lastEmittedRef.current.count)
    ) {
      lastEmittedRef.current = { id: latestInvoiceId, count: invoiceCount };
      onInvoiceUpdate(latestInvoiceId);
    }
  }, [messages, onInvoiceUpdate]);

  if (messages.length === 0) return null;

  const isStreaming = status === "streaming" || status === "submitted";
  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className="space-y-4 mb-4">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] text-sm bg-secondary px-4 py-2 rounded-2xl rounded-br-none">
                <span>
                  {message.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join("")}
                </span>
              </div>
            </div>
          );
        }

        const parsed = parseAssistantMessage(message, {
          isStreaming,
          isLastMessage: isStreaming && message.id === lastId,
        });

        const {
          toolParts,
          visibleTools,
          invoiceParts,
          textContent,
          sourceParts,
          reasoningText,
          hasReasoning,
          isReasoningStreaming,
          showThinking,
          hasContent,
          isLastMessage,
        } = parsed;

        if (!hasContent && !showThinking) return null;

        return (
          <div key={message.id} className="flex justify-start">
            <div className="w-full text-sm text-muted-foreground">
              {showThinking && <ThinkingIndicator />}

              {hasReasoning && (
                <div
                  className={
                    textContent || visibleTools.length > 0 ? "mb-3" : undefined
                  }
                >
                  <Reasoning isStreaming={isReasoningStreaming}>
                    <ReasoningTrigger />
                    <ReasoningContent>{reasoningText}</ReasoningContent>
                  </Reasoning>
                </div>
              )}

              {visibleTools.length > 0 && (
                <div className={textContent ? "mb-3" : undefined}>
                  <ToolCallGroup parts={toolParts} />
                </div>
              )}

              {textContent && (
                <Streamdown
                  isAnimating={isLastMessage}
                  icons={streamdownIcons}
                  controls={streamdownControls}
                  className={streamdownClassName}
                  components={components()}
                >
                  {textContent}
                </Streamdown>
              )}

              {invoiceParts.map((part) => {
                const data = extractInvoiceData(part.output);
                if (!data) return null;
                return (
                  <ChatInvoiceCard
                    key={part.toolCallId}
                    data={data}
                    compact={canvasOpen}
                    onEdit={(id) =>
                      setInvoiceParams({ type: "edit", invoiceId: id })
                    }
                    onViewDetails={(id) =>
                      setInvoiceParams({ type: "details", invoiceId: id })
                    }
                  />
                );
              })}

              {sourceParts.length > 0 && (
                <SourcesList sources={sourceParts.slice(0, 8)} />
              )}
            </div>
          </div>
        );
      })}

      {isStreaming && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="w-full text-sm text-muted-foreground">
            <ThinkingIndicator />
          </div>
        </div>
      )}
    </div>
  );
}
