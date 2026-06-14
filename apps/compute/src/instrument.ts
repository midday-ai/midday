import * as Sentry from "@sentry/bun";

if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    release: process.env.GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA,

    environment:
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.NODE_ENV ||
      "production",

    integrations: [Sentry.consoleLoggingIntegration({ levels: ["error"] })],

    sendDefaultPii: true,
    enableLogs: true,

    tracesSampleRate: 0.1,

    beforeSendTransaction(event) {
      const url = event.request?.url || event.transaction || "";

      if (url.includes("/health")) {
        return null;
      }

      return event;
    },
  });
}
