import type { AppRouter } from "@/server/trpc/router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

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

export function createTRPCClientSSR() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: typeof window !== "undefined" ? "/api/trpc" : getServerUrl(),
        transformer: superjson,
      }),
    ],
  });
}
