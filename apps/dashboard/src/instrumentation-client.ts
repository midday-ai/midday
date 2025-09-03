// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
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

  // Export the function only in production
  module.exports = {
    onRouterTransitionStart: Sentry.captureRouterTransitionStart,
  };
} else {
  // Export a no-op function in development
  module.exports = {
    onRouterTransitionStart: () => {},
  };
}
