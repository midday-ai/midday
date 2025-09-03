// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Only import and initialize Sentry in production
if (process.env.NODE_ENV === "production") {
  const Sentry = require("@sentry/nextjs");

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Lower trace sampling to save quota
    tracesSampleRate: 0.1,

    // Enable logs
    enableLogs: true,

    // Disable debug
    debug: false,
  });
}
