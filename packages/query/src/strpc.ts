import type { Client } from "@midday/supabase/types";
import type {
  MutationFunction,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { z } from "zod";

interface Context {
  supabase: Client;
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
            UseQueryOptions<TOutput, Error, TOutput, [string, TInput?]>,
            "queryKey" | "queryFn"
          >,
        ) => {
          return {
            queryKey: [handler.name, input],
            queryFn: async ({ queryClient }) => {
              const context = queryClient.getQueryData<Context>(["context"]);
              if (!context?.supabase) {
                throw new Error("Supabase client not found in context");
              }
              return handler({ ctx: context, input });
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
                  throw new Error("Supabase client not found in context");
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
          UseQueryOptions<TOutput, Error, TOutput, [string]>,
          "queryKey" | "queryFn"
        >,
      ) => {
        return {
          queryKey: [handler.name],
          queryFn: async ({ queryClient }) => {
            const context = queryClient.getQueryData<Context>(["context"]);
            if (!context?.supabase) {
              throw new Error("Supabase client not found in context");
            }
            return handler({ ctx: context });
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
                throw new Error("Supabase client not found in context");
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

// Keep backward compatibility with createSTRouter, createSTQuery, and createSTMutation
// You can gradually migrate to the new API

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
    queryOptions: (
      input: TInput,
      options?: Omit<
        UseQueryOptions<TOutput, Error, TOutput, [string, TInput?]>,
        "queryKey" | "queryFn"
      >,
    ) => {
      return {
        queryKey: [procedure.name, input],
        queryFn: async ({ queryClient }) => {
          const context = queryClient.getQueryData<Context>(["context"]);
          if (!context?.supabase) {
            throw new Error("Supabase client not found in context");
          }
          return queryFn(context.supabase, input);
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
              throw new Error("Supabase client not found in context");
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
