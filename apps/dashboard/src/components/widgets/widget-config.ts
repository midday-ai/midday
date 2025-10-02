// Widget polling configuration
export const WIDGET_POLLING_CONFIG = {
  refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
} as const;
