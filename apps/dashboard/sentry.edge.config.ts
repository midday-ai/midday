import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: "v0.0.1",
  tracesSampleRate: 1,
  debug: false,
});
