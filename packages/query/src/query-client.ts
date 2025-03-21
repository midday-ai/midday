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
        // serializeData: superjson.serialize,
        // Use JSON.stringify and JSON.parse to ensure plain objects
        // This is more compatible with React Server Components than superjson
        // superjson can cause issues with RSC serialization
        serializeData: (data) => JSON.parse(JSON.stringify(data)),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
        // Deserialize as-is since we're already using plain objects
        deserializeData: (data) => data,
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
