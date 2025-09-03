export async function register() {
  // Only load Sentry configs in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    }
  }
}

// Only export Sentry function in production
export const onRequestError =
  process.env.NODE_ENV === "production"
    ? require("@sentry/nextjs").captureRequestError
    : () => {};
