"use client";

import { type UseChatOptions, useChat as useAIChat } from "@ai-sdk/react";
import { createClient } from "@midday/supabase/client";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";

/**
 * Custom useChat hook that wraps @ai-sdk/react useChat with automatic session management
 * This hook handles Supabase authentication by automatically adding the session token
 * to requests made to the chat API.
 */
export function useChat(options: any = {}) {
  // Create a custom fetch function that includes the Supabase session token
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
        { preconnect: () => {} }, // Required for fetch interface
      ),
    [],
  );

  // Use the AI SDK's useChat with DefaultChatTransport and authenticated fetch
  return useAIChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
      fetch: authenticatedFetch,
    }),
    onFinish: (message) => {
      console.log("Chat finished with message:", message);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
    ...options,
  });
}
