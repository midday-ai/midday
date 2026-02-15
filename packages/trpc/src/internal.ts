import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

/**
 * Create a tRPC client for internal service-to-service calls.
 * Authenticates via INTERNAL_API_KEY header.
 */
export function createInternalClient() {
  const apiUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3003";

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        transformer: superjson,
        headers() {
          return {
            "x-internal-key": process.env.INTERNAL_API_KEY || "",
          };
        },
      }),
    ],
  });
}

/**
 * Pre-configured internal tRPC client singleton.
 * Import this directly in jobs and workers.
 */
let _client: ReturnType<typeof createInternalClient> | null = null;

export function getInternalClient() {
  if (!_client) {
    _client = createInternalClient();
  }
  return _client;
}
