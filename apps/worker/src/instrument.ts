import * as Sentry from "@sentry/bun";

if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    release: process.env.GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA,

    // Use Railway environment name so staging and production are separate in Sentry
    environment:
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.NODE_ENV ||
      "production",

    integrations: [Sentry.consoleLoggingIntegration({ levels: ["error"] })],

    sendDefaultPii: true,
    enableLogs: true,

    // Sample 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,

    // Drop noisy transactions (health checks, admin dashboard)
    beforeSendTransaction(event) {
      const url = event.request?.url || event.transaction || "";

      if (url.includes("/health") || url.includes("/admin")) {
        return null;
      }

      return event;
    },
  });
}
