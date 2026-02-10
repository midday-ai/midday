"use client";

import { CopyInput } from "@/components/copy-input";
import "@/styles/globals.css";
import { Button } from "@midday/ui/button";
import { useEffect } from "react";
import { SUPPORT_EMAIL } from "@/utils/constants";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full text-center px-4">
            <h2 className="font-medium mb-4">Something went wrong</h2>
            <p className="text-sm text-[#878787] mb-6">
              We've been notified and are looking into it.
              <br />
              If this issue persists, please reach out to our support team.
            </p>

            <CopyInput value={SUPPORT_EMAIL} />

            {error.digest && (
              <p className="text-xs text-[#4a4a4a] mt-4">
                Error ID: {error.digest}
              </p>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-6"
            >
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
