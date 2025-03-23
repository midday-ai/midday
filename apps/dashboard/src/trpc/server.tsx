import "server-only";

import { createClient as createServerClient } from "@midday/supabase/server";
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { createSupabaseLink } from "./supabase-link";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Create a cached Supabase server client
export const getSupabaseServerClient = cache(() => createServerClient());

// Create a context factory that uses the server Supabase client
export const createServerContext = cache(async () => {
  const supabase = getSupabaseServerClient();

  return createTRPCContext({ supabase });
});

export const trpc = createTRPCOptionsProxy({
  ctx: createServerContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// If your router is on a separate server, pass a client:
createTRPCOptionsProxy({
  client: createTRPCClient({
    links: [createSupabaseLink(appRouter, getSupabaseServerClient())],
  }),
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
export function prefetch<T extends ReturnType<TRPCQueryOptions<unknown>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // Using type assertion with the original 'as any' since it's handling a complex type situation
    // This is a targeted exception to the no-any rule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
