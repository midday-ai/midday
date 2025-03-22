import "server-only";

import { createClient as createSupabaseClient } from "@midday/supabase/server";
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import { cache } from "react";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routes/_app";
import { createSTRouter } from "./strpc";

// Wrap the makeQueryClient function with server-specific logic
const makeServerQueryClient = () => {
  const queryClient = makeQueryClient();

  // Initialize the server-side Supabase client in the context
  const supabase = createSupabaseClient();
  queryClient.setQueryData(["context"], { supabase });

  return queryClient;
};

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeServerQueryClient);

// Create the server-side router with the initialized query client
export const stRPC = createSTRouter(appRouter);

export function HydrateClient(props: { children: React.ReactNode }) {
  const dehydratedState = dehydrate(getQueryClient());

  return (
    <HydrationBoundary state={dehydratedState}>
      {props.children}
    </HydrationBoundary>
  );
}
