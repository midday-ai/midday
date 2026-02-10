import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { TooltipProvider } from "./components/ui/tooltip";
import { createAppRouter } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Get base path from the <base> tag or default to "/"
function getBasePath() {
  if (typeof document !== "undefined") {
    const base = document.querySelector("base");
    if (base?.href) {
      const url = new URL(base.href);
      return url.pathname.replace(/\/$/, "") || "/";
    }
  }
  return "/";
}

// Create router with detected base path
const router = createAppRouter(getBasePath());

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
