import * as Sentry from "@sentry/bun";

// Only initialize Sentry in production
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  // Ensure to call this before importing any other modules!
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Associate errors with deploys via git commit SHA (provided by Railway)
    release: process.env.RAILWAY_GIT_COMMIT_SHA,

    integrations: [
      // Send console.error calls as logs to Sentry
      Sentry.consoleLoggingIntegration({ levels: ["error"] }),
    ],

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/bun/configuration/options/#sendDefaultPii
    sendDefaultPii: true,

    // Add Performance Monitoring by setting tracesSampleRate
    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    // We recommend adjusting this value in production
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
    tracesSampleRate: 0.5,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Set environment
    environment: process.env.NODE_ENV || "production",
  });
}
