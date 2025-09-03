"use client";

import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Only capture exceptions in production
    if (process.env.NODE_ENV === "production") {
      // Dynamically import Sentry only in production
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
