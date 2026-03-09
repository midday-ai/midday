import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

function isUnauthorizedError(error: Error): boolean {
  if ("data" in error && typeof (error as any).data?.code === "string") {
    return (error as any).data.code === "UNAUTHORIZED";
  }
  return false;
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: isServer
      ? undefined
      : new QueryCache({
          onError: (error) => {
            if (isUnauthorizedError(error)) {
              window.location.href = "/login";
            }
          },
        }),
    defaultOptions: {
      queries: {
        // Default staleTime of 2 minutes - queries won't refetch if data is fresh
        // For static data (user settings, team config), override with longer staleTime (5+ min)
        staleTime: 2 * 60 * 1000,
        // Keep unused data in cache for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000,
        retry: isServer
          ? false
          : (failureCount, error) => {
              // Never retry auth errors — the token won't change between attempts
              // and retrying just delays the redirect to /login.
              if (isUnauthorizedError(error)) return false;
              return failureCount < 2;
            },
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
