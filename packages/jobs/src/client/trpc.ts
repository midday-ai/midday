import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("API_URL environment variable is not set");
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
      headers() {
        return {
          "x-service-secret": process.env.SERVICE_SECRET || "",
        };
      },
    }),
  ],
});
