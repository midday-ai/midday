// Helper function to safely format values with fallbacks
export const safeValue = (
  value: string | null | undefined,
  fallback = "Not specified",
) => (value && value.trim() !== "" ? value : fallback);
