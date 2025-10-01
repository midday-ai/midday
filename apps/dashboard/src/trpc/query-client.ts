import { toast } from "@midday/ui/use-toast";
import {
  MutationCache,
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import superjson from "superjson";

/**
 * Global mutation error handler.
 * This runs for ALL mutations, even if they have their own onError handlers.
 */
function handleMutationError(error: unknown) {
  // Check if this is a tRPC error
  const trpcError = error as TRPCClientErrorLike<any>;

  if (trpcError?.data?.code === "PAYMENT_REQUIRED") {
    toast({
      title: "Trial Expired",
      description:
        "Your trial has expired. Please upgrade to a paid plan to continue using Midday.",
      variant: "error",
      duration: 10000, // Show for 10 seconds
    });
  }
}

export function makeQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: handleMutationError,
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
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
