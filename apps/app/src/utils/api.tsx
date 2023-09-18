import React from "react";
import { refreshTokenLink } from "@pyncz/trpc-refresh-token-link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@midday/api";
import {
  deleteTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

export { type RouterInputs, type RouterOutputs } from "@midday/api";

export const api = createTRPCReact<AppRouter>();

const blah = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_ENDPOINT!}/api/trpc`,
    }),
  ],
});

export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        refreshTokenLink({
          getRefreshToken: async () => getRefreshToken(),
          // onRefreshFailed: async () => deleteTokens(),
          onJwtPairFetched: async (tokens) => setTokens(tokens),
          fetchJwtPairByRefreshToken: (refreshToken) => {
            return blah.auth.refreshToken.query({ refreshToken });
          },
        }),
        httpBatchLink({
          url: `${process.env.EXPO_PUBLIC_API_ENDPOINT!}/api/trpc`,
          async headers() {
            const token = await getAccessToken();

            const headers = new Map<string, string>();
            headers.set("x-trpc-source", "expo-react");

            if (token) {
              headers.set("authorization", token);
            }

            return Object.fromEntries(headers);
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}
