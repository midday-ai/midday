"use client";

import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Streamdown } from "streamdown";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useChatToolInvalidation } from "./chat-invalidation";
import {
  extractInvoiceData,
  INVOICE_TOOLS,
  isToolPart,
  normalizeToolPart,
  parseAssistantMessage,
} from "./chat-utils";
import { SourcesList } from "./sources-list";
import {
  makeStreamdownComponents,
  streamdownClassName,
  streamdownControls,
  streamdownIcons,
} from "./streamdown-config";
import { ThinkingIndicator } from "./thinking-indicator";
import { ToolCallGroup } from "./tool-call-group";

// ---------------------------------------------------------------------------
// Memoized message components
// ---------------------------------------------------------------------------

const UserMessage = memo(function UserMessage({
  message,
}: {
  message: UIMessage;
}) {
  return (
    <div className="flex justify-end">
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
});

type AssistantMessageProps = {
  message: UIMessage;
  isStreaming: boolean;
  isLastMessage: boolean;
  components: Record<
    string,
    React.FC<{ href?: string; children?: React.ReactNode }>
  >;
};

const AssistantMessage = memo(
  function AssistantMessage({
    message,
    isStreaming,
    isLastMessage,
    components,
  }: AssistantMessageProps) {
    const parsed = parseAssistantMessage(message, {
      isStreaming,
      isLastMessage,
    });

    const {
      toolParts,
      visibleTools,
      textContent,
      sourceParts,
      showThinking,
      hasContent,
      isLastMessage: parsedIsLast,
    } = parsed;

    if (!hasContent && !showThinking) return null;

    return (
      <div className="flex justify-start">
        <div className="w-full text-sm text-muted-foreground">
          {showThinking && <ThinkingIndicator />}

          {textContent && (
            <Streamdown
              isAnimating={parsedIsLast}
              icons={streamdownIcons}
              controls={streamdownControls}
              className={streamdownClassName}
              components={components}
            >
              {textContent}
            </Streamdown>
          )}

          {visibleTools.length > 0 && (
            <div className={textContent ? "mt-3" : undefined}>
              <ToolCallGroup parts={toolParts} />
            </div>
          )}

          {sourceParts.length > 0 && (
            <SourcesList sources={sourceParts.slice(0, 8)} />
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    if (prev.isLastMessage || next.isLastMessage) return false;
    return prev.message === next.message;
  },
);

// ---------------------------------------------------------------------------
// Invoice scanning — lightweight pass without full parseAssistantMessage
// ---------------------------------------------------------------------------

function scanInvoiceIds(messages: UIMessage[]): {
  latestId: string | null;
  count: number;
} {
  let latestId: string | null = null;
  let count = 0;

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.parts) {
      if (!isToolPart(part as { type: string })) continue;
      const norm = normalizeToolPart(part as Record<string, unknown>);
      if (
        !INVOICE_TOOLS.has(norm.toolName) ||
        norm.state !== "output-available" ||
        !norm.output
      )
        continue;
      const data = extractInvoiceData(norm.output);
      const id = data?.id as string | undefined;
      if (id) {
        latestId = id;
        count++;
      }
    }
  }

  return { latestId, count };
}

// ---------------------------------------------------------------------------
// ChatMessages
// ---------------------------------------------------------------------------

type ChatMessagesProps = {
  messages: UIMessage[];
  status: string;
  onInvoiceUpdate?: (invoiceId: string) => void;
};

export function ChatMessages({
  messages,
  status,
  onInvoiceUpdate,
}: ChatMessagesProps) {
  useChatToolInvalidation(messages);

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
      setInvoiceParams({ invoiceId: href.slice(5), invoiceType: "details" });
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
      setInboxParams({ inboxId: href.slice(7), inboxType: "details" });
      return true;
    }
    if (href.startsWith("#doc:")) {
      setDocumentParams({ documentId: href.slice(5) });
      return true;
    }
    return false;
  }, []);

  const components = useMemo(
    () => makeStreamdownComponents(handleEntityLink),
    [handleEntityLink],
  );

  const lastEmittedRef = useRef<{ id: string | null; count: number }>({
    id: null,
    count: 0,
  });

  useEffect(() => {
    if (!onInvoiceUpdate) return;

    const { latestId, count } = scanInvoiceIds(messages);

    if (
      latestId &&
      (latestId !== lastEmittedRef.current.id ||
        count !== lastEmittedRef.current.count)
    ) {
      lastEmittedRef.current = { id: latestId, count };
      onInvoiceUpdate(latestId);
    }
  }, [messages, onInvoiceUpdate]);

  if (messages.length === 0) return null;

  const isStreaming = status === "streaming" || status === "submitted";
  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className="space-y-4 mb-4">
      {messages.map((message) => {
        if (message.role === "user") {
          return <UserMessage key={message.id} message={message} />;
        }

        const isLast = isStreaming && message.id === lastId;

        return (
          <AssistantMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming}
            isLastMessage={isLast}
            components={components}
          />
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
