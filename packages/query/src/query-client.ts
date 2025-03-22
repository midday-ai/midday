import { createClient as createSupabaseBrowserClient } from "@midday/supabase/client";
import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Two-step serialization:
        // 1. Use superjson to handle special types (dates, maps, sets, etc.)
        // 2. Convert to plain objects for RSC compatibility
        serializeData: (data) => {
          const serialized = superjson.serialize(data);
          return JSON.parse(JSON.stringify(serialized));
        },
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        // Deserialize using superjson to restore special types
        deserializeData: (data) => superjson.deserialize(data),
      },
    },
  });

  // Only initialize the client-side Supabase client
  // Server-side initialization will be handled in the server module
  if (!isServer) {
    const supabase = createSupabaseBrowserClient();
    queryClient.setQueryData(["context"], { supabase });
  }

  return queryClient;
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
