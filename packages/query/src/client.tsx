import { QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";
import { SupabaseContextProvider } from "./context-provider";
import { getQueryClient } from "./query-client";
// Re-export HydrationBoundary from React Query directly
export { HydrationBoundary } from "@tanstack/react-query";
export { stRPC } from "./index";

// Export the full wrapped provider
export function QueryClientProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ReactQueryClientProvider client={queryClient}>
      <SupabaseContextProvider>{props.children}</SupabaseContextProvider>
    </ReactQueryClientProvider>
  );
}
