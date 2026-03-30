"use client";

import { InvoiceTemplate } from "@midday/mcp-apps/invoice";
import type { UIMessage } from "ai";
import { useCallback } from "react";
import { Streamdown } from "streamdown";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import {
  extractInvoiceData,
  HIDDEN_TOOLS,
  INVOICE_TOOLS,
  isToolPart,
  type NormalizedToolPart,
  normalizeToolPart,
  type SourceUrlPart,
} from "./chat-utils";
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
};

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const { setParams: setTransactionParams } = useTransactionParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setInboxParams } = useInboxParams();
  const { setParams: setDocumentParams } = useDocumentParams();

  const handleEntityLink = useCallback((href: string) => {
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

        const textContent = message.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");

        const toolParts: NormalizedToolPart[] = message.parts
          .filter((p) => isToolPart(p as { type: string }))
          .map((p) => normalizeToolPart(p as Record<string, unknown>));

        const visibleTools = toolParts.filter(
          (p) => !HIDDEN_TOOLS.has(p.toolName),
        );

        const sourceParts = message.parts.filter(
          (p) => p.type === "source-url",
        ) as SourceUrlPart[];

        const reasoningParts = message.parts.filter(
          (p) => p.type === "reasoning",
        ) as { type: "reasoning"; text: string }[];
        const reasoningText = reasoningParts.map((p) => p.text).join("\n\n");
        const hasReasoning = reasoningParts.length > 0;
        const isReasoningStreaming =
          isStreaming &&
          message.id === lastId &&
          message.parts.at(-1)?.type === "reasoning";

        const invoiceParts = toolParts.filter(
          (p) =>
            INVOICE_TOOLS.has(p.toolName) &&
            p.state === "output-available" &&
            p.output,
        );

        const isLast = isStreaming && message.id === lastId;
        const showThinking =
          isLast && !textContent && visibleTools.length === 0 && !hasReasoning;
        const hasContent =
          textContent ||
          visibleTools.length > 0 ||
          invoiceParts.length > 0 ||
          sourceParts.length > 0 ||
          hasReasoning;

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
                  isAnimating={isLast}
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
                  <div key={part.toolCallId} className="mt-3">
                    <InvoiceTemplate data={data} />
                  </div>
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
