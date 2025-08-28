import "server-only";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { createClient } from "@midday/supabase/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpLink,
  loggerLink,
  retryLink,
} from "@trpc/client";
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
      retryLink({
        retry(opts) {
          // Retry on server errors or connection failures
          if (opts.error.data?.code === "INTERNAL_SERVER_ERROR") {
            return opts.attempts <= 3;
          }
          // Retry on fetch failures (network issues)
          if (opts.error.message?.includes("fetch failed")) {
            return opts.attempts <= 3;
          }
          // Don't retry client errors (4xx)
          return false;
        },
        // Exponential backoff: 500ms, 1s, 2s
        retryDelayMs: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000),
      }),
      httpLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        transformer: superjson,
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
        logger(opts) {
          const { type, path, direction, result } = opts;

          if (direction === "down" && result instanceof Error) {
            console.error(`[tRPC Server Error] ${type} ${path}:`, {
              error: result.message,
              stack: result.stack,
              cause: result.cause,
              timestamp: new Date().toISOString(),
              url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
            });
          } else if (direction === "up") {
            console.log(`[tRPC Server Request] ${type} ${path}`, {
              timestamp: new Date().toISOString(),
            });
          }
        },
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
