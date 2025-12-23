import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default staleTime of 2 minutes - queries won't refetch if data is fresh
        // For static data (user settings, team config), override with longer staleTime (5+ min)
        staleTime: 2 * 60 * 1000,
        // Keep unused data in cache for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
