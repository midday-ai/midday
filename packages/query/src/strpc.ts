import type { Client } from "@midday/supabase/types";
import type {
  MutationFunction,
  QueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { z } from "zod";

interface Context {
  supabase: Client;
}

// Define a type for the query context we expect from TanStack Query
interface QueryContext {
  client: QueryClient;
  signal: AbortSignal;
}

/**
 * To allow easy interactions with groups of related queries, such as
 * invalidating all queries of a router, we use an array as the path when
 * storing in tanstack query.
 **/
export function createQueryKey(procedurePath: string[], input?: unknown) {
  return input !== undefined ? [...procedurePath, input] : procedurePath;
}

/**
 * Router builder
 */
export const t = {
  router: <T extends Record<string, unknown>>(procedures: T) => procedures,
  procedure: {
    input: <TInput>(schema: z.ZodType<TInput>) => ({
      query: <TOutput>(
        handler: (opts: { ctx: Context; input: TInput }) => Promise<TOutput>,
      ) => ({
        queryOptions: (
          input: TInput,
          options?: Omit<
            UseQueryOptions<TOutput, Error, TOutput, unknown[]>,
            "queryKey" | "queryFn"
          >,
        ) => {
          // Determine the path from the call stack - first try to find the caller structure
          // This approach preserves compatibility with stRPC.transactions.getTransactions.queryOptions
          const caller = new Error().stack?.split("\n")[2] || "";
          const match = caller.match(/stRPC\.([^\.]+)\.([^\.]+)/);

          // Build the procedure path
          const routerName = match?.[1] || "unknown";
          const procedureName = match?.[2] || handler.name || "unknown";
          const queryKey = createQueryKey([routerName, procedureName], input);

          return {
            queryKey,
            queryFn: async (context: QueryContext) => {
              // Try to get the Supabase client from the QueryClient's context
              const contextData = context.client.getQueryData<Context>([
                "context",
              ]);

              if (!contextData?.supabase) {
                throw new Error(
                  "Supabase client not found in context. " +
                    "Make sure to initialize the query client with context using " +
                    "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
                );
              }

              return handler({ ctx: contextData, input });
            },
            ...options,
          };
        },
      }),
      mutation: <TOutput>(
        handler: (opts: { ctx: Context; input: TInput }) => Promise<TOutput>,
      ) => ({
        mutationOptions: (
          options?: Omit<
            UseMutationOptions<TOutput, Error, TInput, unknown>,
            "mutationFn"
          >,
        ) => {
          return {
            mutationFn: ((input: TInput, context: unknown) => {
              return (async () => {
                // @ts-expect-error - we know the queryClient is available in the mutation context
                const queryClient = context?.queryClient;
                if (!queryClient) {
                  throw new Error("QueryClient not found in mutation context");
                }
                const contextData = queryClient.getQueryData<Context>([
                  "context",
                ]);
                if (!contextData?.supabase) {
                  throw new Error(
                    "Supabase client not found in context. " +
                      "Make sure to initialize the query client with context using " +
                      "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
                  );
                }
                return handler({ ctx: contextData, input });
              })();
            }) as MutationFunction<TOutput, TInput>,
            ...options,
          };
        },
      }),
    }),
    query: <TOutput>(
      handler: (opts: { ctx: Context }) => Promise<TOutput>,
    ) => ({
      queryOptions: (
        options?: Omit<
          UseQueryOptions<TOutput, Error, TOutput, unknown[]>,
          "queryKey" | "queryFn"
        >,
      ) => {
        // Determine the path from the call stack
        const caller = new Error().stack?.split("\n")[2] || "";
        const match = caller.match(/stRPC\.([^\.]+)\.([^\.]+)/);

        // Build the procedure path
        const routerName = match?.[1] || "unknown";
        const procedureName = match?.[2] || handler.name || "unknown";
        const queryKey = createQueryKey([routerName, procedureName]);

        return {
          queryKey,
          queryFn: async (context: QueryContext) => {
            // Try to get the Supabase client from the QueryClient's context
            const contextData = context.client.getQueryData<Context>([
              "context",
            ]);

            if (!contextData?.supabase) {
              throw new Error(
                "Supabase client not found in context. " +
                  "Make sure to initialize the query client with context using " +
                  "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
              );
            }

            return handler({ ctx: contextData });
          },
          ...options,
        };
      },
    }),
    mutation: <TInput, TOutput>(
      handler: (opts: { ctx: Context; input: TInput }) => Promise<TOutput>,
    ) => ({
      mutationOptions: (
        options?: Omit<
          UseMutationOptions<TOutput, Error, TInput, unknown>,
          "mutationFn"
        >,
      ) => {
        return {
          mutationFn: ((input: TInput, context: unknown) => {
            return (async () => {
              // @ts-expect-error - we know the queryClient is available in the mutation context
              const queryClient = context?.queryClient;
              if (!queryClient) {
                throw new Error("QueryClient not found in mutation context");
              }
              const contextData = queryClient.getQueryData<Context>([
                "context",
              ]);
              if (!contextData?.supabase) {
                throw new Error(
                  "Supabase client not found in context. " +
                    "Make sure to initialize the query client with context using " +
                    "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
                );
              }
              return handler({ ctx: contextData, input });
            })();
          }) as MutationFunction<TOutput, TInput>,
          ...options,
        };
      },
    }),
  },
};

/**
 * Function to create a router with the provided procedures
 */
export function createSTRouter<T extends Record<string, unknown>>(
  procedures: T,
) {
  return procedures;
}

/**
 * Helper for creating a query procedure that integrates with React Query
 */
export function createSTQuery<TInput, TOutput>(
  queryFn: (supabase: Client, input: TInput) => Promise<TOutput>,
) {
  const procedure = {
    name: "queryFn", // Default name for the query
    queryOptions: (
      input: TInput,
      options?: Omit<
        UseQueryOptions<TOutput, Error, TOutput, unknown[]>,
        "queryKey" | "queryFn"
      >,
    ) => {
      // Determine the path from the call stack
      const caller = new Error().stack?.split("\n")[2] || "";
      const match = caller.match(/stRPC\.([^\.]+)\.([^\.]+)/);

      // Build the procedure path
      const routerName = match?.[1] || "unknown";
      const procedureName = match?.[2] || procedure.name || "unknown";
      const queryKey = createQueryKey([routerName, procedureName], input);

      return {
        queryKey,
        queryFn: async (context: QueryContext) => {
          // Try to get the Supabase client from the QueryClient's context
          const contextData = context.client.getQueryData<Context>(["context"]);

          if (!contextData?.supabase) {
            throw new Error(
              "Supabase client not found in context. " +
                "Make sure to initialize the query client with context using " +
                "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
            );
          }

          return queryFn(contextData.supabase, input);
        },
        ...options,
      };
    },
  };

  return procedure;
}

/**
 * Helper for creating a mutation procedure that integrates with React Query
 */
export function createSTMutation<TInput, TOutput>(
  mutationFn: (supabase: Client, input: TInput) => Promise<TOutput>,
) {
  const procedure = {
    mutationOptions: (
      options?: Omit<
        UseMutationOptions<TOutput, Error, TInput, unknown>,
        "mutationFn"
      >,
    ) => {
      return {
        mutationFn: ((input: TInput, context: unknown) => {
          return (async () => {
            // @ts-expect-error - we know the queryClient is available in the mutation context
            const queryClient = context?.queryClient;
            if (!queryClient) {
              throw new Error("QueryClient not found in mutation context");
            }
            const contextData = queryClient.getQueryData<Context>(["context"]);
            if (!contextData?.supabase) {
              throw new Error(
                "Supabase client not found in context. " +
                  "Make sure to initialize the query client with context using " +
                  "initializeQueryClient() on the server or SupabaseContextProvider on the client.",
              );
            }
            return mutationFn(contextData.supabase, input);
          })();
        }) as MutationFunction<TOutput, TInput>,
        ...options,
      };
    },
  };

  return procedure;
}

/**
 * Utility types for router inputs and outputs
 */
export type RouterInputs<T> = {
  [K in keyof T]: T[K] extends { queryOptions: (input: infer I) => unknown }
    ? I
    : T[K] extends { mutationOptions: (input: infer I) => unknown }
      ? I
      : never;
};

export type RouterOutputs<T> = {
  [K in keyof T]: T[K] extends {
    queryOptions: (...args: unknown[]) => {
      queryFn: (...args: unknown[]) => Promise<infer O>;
    };
  }
    ? O
    : T[K] extends {
          mutationOptions: (...args: unknown[]) => {
            mutationFn: (...args: unknown[]) => Promise<infer O>;
          };
        }
      ? O
      : never;
};
