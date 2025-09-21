"use client";

import { Canvas } from "@/components/canvas/canvas";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Messages } from "@/components/chat/messages";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@api/ai/types";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, generateId } from "ai";
import { useMemo } from "react";

type Props = {
  id?: string | null;
  geo?: Geo;
};

export function ChatInterface({ id, geo }: Props) {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });
  const isCanvasVisible = !!current;
  const { isHome, isChatPage, chatId: routeChatId } = useChatInterface();

  // Use provided id, or get from route, or generate new one
  const providedId = id ?? routeChatId;

  // Generate a consistent chat ID - use provided ID or generate one
  const chatId = useMemo(() => providedId ?? generateId(), [providedId]);

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
    enableBatching: true,
    experimental_throttle: 50,
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
            timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
      },
    }),
  });

  return (
    <div className="relative h-full overflow-hidden w-full">
      <div
        className={cn(
          "relative h-full w-full transition-all duration-300 ease-in-out",
          isHome && "h-[calc(100vh-648px)]",
          isChatPage && "h-[calc(100vh-88px)]",
          isCanvasVisible && "pr-[603px]",
        )}
      >
        <ChatHeader />

        <div className="relative w-full">
          <Messages />
          <ChatInput />
        </div>
      </div>

      <Canvas />

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
    </div>
  );
}
