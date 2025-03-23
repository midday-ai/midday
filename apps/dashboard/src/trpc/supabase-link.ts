import type { Client } from "@midday/supabase/types";
import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "./routers/_app";
/**
 * Creates a supabase tRPC link that executes procedures directly on the client
 * without making HTTP requests to a regular tRPC server. This uses Supabase client
 * SDK to handle data operations directly from the client.
 */
export const createSupabaseLink = (
  router: AppRouter,
  supabase: Client,
): TRPCLink<AppRouter> => {
  return () => {
    return ({ op }) => {
      return observable((observer) => {
        const { path, input } = op;

        // Create Supabase client for context

        try {
          // Create context with Supabase client
          const caller = router.createCaller({ supabase });

          // Execute procedure by dynamically walking the path
          const execute = async () => {
            try {
              const pathParts = path.split(".");

              let current = caller;

              // For nested paths like "subRouter.procedure"
              for (let i = 0; i < pathParts.length - 1; i++) {
                current = current[pathParts[i]];
              }

              const procedureName = pathParts[pathParts.length - 1];

              // Execute the procedure with input
              const result = await current[procedureName](input);

              // Return the result as expected by tRPC
              observer.next({ result: { data: result } });
              observer.complete();
            } catch (error) {
              observer.error(error);
            }
          };

          // Start execution
          execute();
        } catch (error) {
          observer.error(error);
        }

        // Return unsubscribe function
        return () => {};
      });
    };
  };
};
