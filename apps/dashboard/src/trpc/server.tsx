import "server-only";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { getLocationHeaders } from "@midday/location";
import { createClient } from "@midday/supabase/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCClient, httpLink, loggerLink } from "@trpc/client";
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";
import { Cookies } from "@/utils/constants";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Server-side: prefer Railway private networking (skips DNS + TLS + Cloudflare)
// Falls back to public URL for local dev / non-Railway environments
const API_BASE_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

const SSR_FETCH_TIMEOUT_MS = 8_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  return fetch(input, { ...init, signal });
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient({
    links: [
      httpLink({
        url: `${API_BASE_URL}/trpc`,
        transformer: superjson,
        fetch: fetchWithTimeout,
        async headers() {
          const [supabase, cookieStore, headersList] = await Promise.all([
            createClient(),
            cookies(),
            headers(),
          ]);

          const {
            data: { session },
          } = await supabase.auth.getSession();

          const location = getLocationHeaders(headersList);

          const result: Record<string, string> = {
            Authorization: `Bearer ${session?.access_token}`,
            "x-user-timezone": location.timezone,
            "x-user-locale": location.locale,
            "x-user-country": location.country,
          };

          // Pass force-primary cookie as header to API for replication lag handling
          const forcePrimary = cookieStore.get(Cookies.ForcePrimary);
          if (forcePrimary?.value === "true") {
            result["x-force-primary"] = "true";
          }

          return result;
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

/**
 * Get a tRPC client for server-side API routes
 * Use this when you need to call mutations from API routes (e.g., webhooks, callbacks)
 * For queries, use the `trpc` proxy with `queryOptions` instead
 *
 * @param options.forcePrimary - Force all reads to use the primary database,
 *   bypassing replicas. Use this in auth callbacks and other flows where
 *   read-after-write consistency is critical (e.g., reading a user that was
 *   just created). This is more reliable than depending on the cookie alone.
 */
export async function getTRPCClient(options?: { forcePrimary?: boolean }) {
  // Parallelize independent async calls
  const [supabase, cookieStore, headersList] = await Promise.all([
    createClient(),
    cookies(),
    headers(),
  ]);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const location = getLocationHeaders(headersList);

  const shouldForcePrimary =
    options?.forcePrimary ||
    cookieStore.get(Cookies.ForcePrimary)?.value === "true";

  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${API_BASE_URL}/trpc`,
        transformer: superjson,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "x-user-timezone": location.timezone,
          "x-user-locale": location.locale,
          "x-user-country": location.country,
          ...(shouldForcePrimary && {
            "x-force-primary": "true",
          }),
        },
      }),
    ],
  });
}
