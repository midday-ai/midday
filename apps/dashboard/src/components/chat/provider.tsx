"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@api/ai/types";
import { createClient } from "@midday/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, generateId } from "ai";
import { useMemo } from "react";

type Props = {
  children: React.ReactNode;
  id?: string | null;
  geo?: Geo;
};

export function ChatProvider({ children, id, geo }: Props) {
  const trpc = useTRPC();
  const { chatId: routeChatId } = useChatInterface();

  // Use provided id, or get from route, or generate new one
  const providedId = id ?? routeChatId;

  // Generate a consistent chat ID - use provided ID or generate one
  const chatId = useMemo(() => providedId ?? generateId(), [providedId]);

  const chatData = useQuery(
    trpc.chats.get.queryOptions(
      { chatId },
      {
        enabled: !!providedId,
      },
    ),
  );

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

  useChat<UIChatMessage>({
    id: chatId,
    messages: chatData?.data?.messages ?? [],
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            id: chatId,
            message: messages[messages.length - 1],
            country: geo?.country,
            city: geo?.city,
            region: geo?.region,
            timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
      },
    }),
  });

  return (
    <>
      {children}

      {process.env.NODE_ENV === "development" && (
        <AIDevtools
          config={{
            streamCapture: {
              enabled: true,
              endpoint: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
              autoConnect: true,
            },
          }}
        />
      )}
    </>
  );
}
