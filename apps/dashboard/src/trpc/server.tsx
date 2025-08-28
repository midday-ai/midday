import "server-only";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { createClient } from "@midday/supabase/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { createTRPCClient, loggerLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        transformer: superjson,
        fetch: (url, options) => {
          const startTime = Date.now();
          const requestId = Math.random().toString(36).substr(2, 9);

          console.log(`[${requestId}] TRPC Request:`, {
            url,
            method: options?.method || "POST",
            bodySize: options?.body ? new Blob([options.body]).size : 0,
            userAgent: options?.headers?.["User-Agent"] || "unknown",
          });

          return fetch(url, {
            ...options,
            // Force HTTP/1.1 to avoid HTTP/2 issues
            headers: {
              ...options?.headers,
              Connection: "keep-alive",
            },
          })
            .then((response) => {
              const duration = Date.now() - startTime;
              console.log(`[${requestId}] Success:`, {
                status: response.status,
                duration: `${duration}ms`,
                headers: {
                  server: response.headers.get("server"),
                  via: response.headers.get("via"),
                  "fly-request-id": response.headers.get("fly-request-id"),
                },
              });
              return response;
            })
            .catch((error) => {
              const duration = Date.now() - startTime;
              console.error(`[${requestId}] Failed:`, {
                duration: `${duration}ms`,
                error: error.message,
                cause: error.cause
                  ? {
                      code: error.cause.code,
                      host: error.cause.host,
                      port: error.cause.port,
                      localAddress: error.cause.localAddress,
                    }
                  : null,
              });
              throw error;
            });
        },
        async headers() {
          const supabase = await createClient();

          const {
            data: { session },
          } = await supabase.auth.getSession();

          return {
            Authorization: `Bearer ${session?.access_token}`,
            "x-user-timezone": await getTimezone(),
            "x-user-locale": await getLocale(),
            "x-user-country": await getCountryCode(),
          };
        },
      }),
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
      }),
    ],
  }),
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

export function batchPrefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptionsArray: T[],
) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      void queryClient.prefetchQuery(queryOptions);
    }
  }
}
