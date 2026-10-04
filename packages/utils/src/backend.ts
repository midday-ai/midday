/** Existing deployments keep Supabase unless the local backend is explicitly selected. */
export function getBackendProvider(): "supabase" | "local" {
  const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER ?? "supabase";
  if (provider !== "supabase" && provider !== "local") {
    throw new Error("NEXT_PUBLIC_BACKEND_PROVIDER must be supabase or local");
  }
  return provider;
}

export function isLocalBackend(): boolean {
  return getBackendProvider() === "local";
}
