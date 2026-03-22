"use client";

import { useChat, useChatActions } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@midday/api/ai/types";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { Conversation, ConversationContent } from "@midday/ui/conversation";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, generateId } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { Portal } from "@/components/portal";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useChatStatus } from "@/hooks/use-chat-status";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import type { Geo } from "@/utils/geo";
import { ChatHeader, ChatInput, ChatMessages, ChatStatusIndicators } from "./";
import { InvoiceCanvasPanel } from "./invoice-canvas-panel";

type Props = {
  geo?: Geo;
};

export function ChatInterface({ geo }: Props) {
  const { chatId: routeChatId, isHome } = useChatInterface();
  const chatId = useMemo(() => routeChatId ?? generateId(), [routeChatId]);
  const { reset } = useChatActions();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { canvas, invoiceId, setParams: setInvoiceParams } = useInvoiceParams();
  const isCanvasOpen = canvas === true;
  const prevChatIdRef = useRef<string | null>(routeChatId);

  useEffect(() => {
    const prevChatId = prevChatIdRef.current;
    const currentChatId = routeChatId;

    if (prevChatId && prevChatId !== currentChatId) {
      reset();
      if (isCanvasOpen) {
        setInvoiceParams(null);
      }
    }

    prevChatIdRef.current = currentChatId;
  }, [routeChatId, reset, isCanvasOpen, setInvoiceParams]);

  const authenticatedFetch = useMemo(
    () =>
      Object.assign(
        async (url: RequestInfo | URL, requestOptions?: RequestInit) => {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          return fetch(url, {
            ...requestOptions,
            headers: {
              ...requestOptions?.headers,
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
          });
        },
      ),
    [],
  );

  const { messages, status } = useChat<UIChatMessage>({
    id: chatId,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
            country: geo?.country,
            city: geo?.city,
            messages,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...(invoiceId && { invoiceId }),
          },
        };
      },
    }),
  });

  const {
    currentToolCall,
    bankAccountRequired,
    hasTextContent,
    hasInsightData,
  } = useChatStatus(messages, status);

  const hasMessages = messages.length > 0;
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const justFinished =
      prevStatusRef.current !== "ready" && status === "ready";
    prevStatusRef.current = status;

    if (!justFinished) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    for (const part of lastMsg.parts) {
      const type = part.type as string;
      const toolPart = part as {
        output?: {
          action?: string;
          params?: Record<string, unknown>;
          invoiceId?: string;
        };
      };

      if (
        (type === "tool-createInvoice" || type === "tool-updateInvoice") &&
        toolPart.output?.action === "open_invoice_sheet"
      ) {
        const params = toolPart.output.params ?? {};
        setInvoiceParams({
          type: (params.type as "create" | "edit") ?? "create",
          canvas: true,
          ...(params.customerId && {
            selectedCustomerId: params.customerId as string,
          }),
          ...(params.invoiceId && {
            invoiceId: params.invoiceId as string,
          }),
        });
        return;
      }

      if (
        type === "tool-modifyInvoiceDraft" &&
        toolPart.output?.action === "refresh_invoice"
      ) {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });
        return;
      }
    }
  }, [status, messages, setInvoiceParams, queryClient, trpc]);

  return (
    <div
      className={cn(
        "relative flex size-full",
        isHome && "h-[calc(100vh-764px)] chat-interface-container-scrollable",
        !isHome && "h-[calc(100vh-88px)] overflow-hidden",
      )}
    >
      <div
        className={cn(
          "relative flex-1 transition-[margin] duration-300 ease-in-out",
          !hasMessages && "flex items-center justify-center",
          isCanvasOpen && "md:mr-[650px]",
        )}
      >
        {hasMessages && (
          <div className="absolute inset-0 flex flex-col">
            <div className="sticky top-0 left-0 right-0 z-10 shrink-0">
              <div className="bg-background/80 dark:bg-background/50 backdrop-blur-sm pt-6">
                <ChatHeader />
              </div>
            </div>
            <Conversation>
              <ConversationContent className="pb-[150px] pt-14">
                <div className="max-w-2xl mx-auto w-full">
                  <ChatMessages
                    messages={messages}
                    isStreaming={
                      status === "streaming" || status === "submitted"
                    }
                  />
                  <ChatStatusIndicators
                    currentToolCall={currentToolCall}
                    status={status}
                    bankAccountRequired={bankAccountRequired}
                    hasTextContent={hasTextContent}
                    hasInsightData={hasInsightData}
                  />
                </div>
              </ConversationContent>
            </Conversation>
          </div>
        )}

        {isHome ? (
          <div className="fixed bottom-0 left-0 right-0 chat-input-wrapper-static">
            <ChatInput />
          </div>
        ) : (
          <Portal>
            <div className="fixed bottom-0 left-0 right-0">
              <ChatInput />
            </div>
          </Portal>
        )}
      </div>

      <InvoiceCanvasPanel />
    </div>
  );
}
