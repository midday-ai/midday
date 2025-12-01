import type { AppRouter } from "@/server/trpc/router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export function createTRPCClientSSR() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url:
          typeof window !== "undefined"
            ? "/api/trpc"
            : `http://localhost:${process.env.PORT || 3002}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}
