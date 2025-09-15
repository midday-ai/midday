"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { Overview } from "@/components/overview/overview";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@api/ai/types";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import type { Geo } from "@vercel/functions";
import { DefaultChatTransport, generateId } from "ai";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMemo } from "react";
import { Messages } from "./messages";

type Props = {
  id?: string;
  initialMessages?: UIChatMessage[];
  initialTitle?: string | null;
  geo?: Geo;
};

export function ChatInterface({
  id,
  initialMessages,
  initialTitle,
  geo,
}: Props) {
  const pathname = usePathname();

  // Generate a consistent chat ID - use provided ID or generate one
  const chatId = useMemo(() => id ?? generateId(), [id]);

  // Check if we're currently on the root path (no chatId in URL)
  const isOnRootPath = pathname === "/" || pathname === "";

  // Track overview visibility
  const [showOverview, setShowOverview] = useState(isOnRootPath);

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
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
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
    <div className="relative h-full overflow-hidden">
      <ChatHeader />

      <div
        className={cn(
          "relative w-full",
          // Only animate if canvas data came from streaming, not initial messages
          // !canvasFromInitial && "transition-all duration-300 ease-in-out",
          // hasCanvasContent ? "-translate-x-[300px]" : "translate-x-0",
        )}
      >
        {showOverview && <Overview />}
        <Messages />
      </div>

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
