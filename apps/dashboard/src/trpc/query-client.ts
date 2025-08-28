import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          const errorMessage = error?.message || "";
          const errorCode = error?.cause?.code;

          // Log all connection-related failures
          if (
            errorMessage.includes("fetch failed") ||
            errorCode === "ECONNRESET" ||
            errorMessage.includes("TLS connection")
          ) {
            console.warn(
              `🔄 Retry ${failureCount + 1}/3 for connection error:`,
              {
                error: errorMessage,
                code: errorCode,
                host: error?.cause?.host,
                timestamp: new Date().toISOString(),
              },
            );

            // Retry up to 2 times for connection issues
            return failureCount < 2;
          }

          // Don't retry other errors
          return false;
        },
        retryDelay: (attemptIndex) => {
          // Quick retries for connection issues (0.5s, 1s)
          const delay = 500 * (attemptIndex + 1);
          console.log(`⏱️ Retrying in ${delay}ms...`);
          return delay;
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
