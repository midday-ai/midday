import "server-only";

import type { AppRouter } from "@/server/trpc/router";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
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

// Get the server URL for server-side requests
// In production (Fly.io), use 127.0.0.1 instead of localhost for better reliability
function getServerUrl() {
  const port = process.env.PORT || 3002;
  const host =
    process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME
      ? "127.0.0.1" // Use 127.0.0.1 in production (more reliable in containers)
      : "localhost";
  return `http://${host}:${port}/api/trpc`;
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: typeof window !== "undefined" ? "/api/trpc" : getServerUrl(),
        transformer: superjson,
      }),
    ],
  }) as any,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export async function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();

  try {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      await queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      await queryClient.prefetchQuery(queryOptions);
    }
  } catch (error) {
    // Log error but don't throw - allow page to render
    console.error("[prefetch] Error prefetching query:", error);
    // Don't rethrow - let the component handle the error state
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
