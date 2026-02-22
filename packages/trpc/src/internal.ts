import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { fetchWithRetry } from "./fetch-with-retry";

/**
 * Create a tRPC client for internal service-to-service calls.
 * Authenticates via INTERNAL_API_KEY header.
 */
export function createInternalClient() {
  const apiUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3003";

  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!internalApiKey) {
    throw new Error(
      "INTERNAL_API_KEY environment variable is required for internal tRPC client",
    );
  }

  const trpcUrl = `${apiUrl}/trpc`;

  if (!process.env.API_INTERNAL_URL && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn(
      `[trpc-internal] Neither API_INTERNAL_URL nor NEXT_PUBLIC_API_URL is set, falling back to ${trpcUrl}`,
    );
  }

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: trpcUrl,
        transformer: superjson,
        fetch: fetchWithRetry,
        headers() {
          return {
            "x-internal-key": internalApiKey,
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
