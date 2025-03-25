import * as Sentry from "@sentry/nextjs";

export const onRequestError = Sentry.captureRequestError;
