"use client";

import { CopyInput } from "@/components/copy-input";
import "@/styles/globals.css";
import { Button } from "@midday/ui/button";
import { useEffect } from "react";

const SUPPORT_EMAIL = "support@midday.ai";

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-medium mb-3">Something went wrong</h1>
            <p className="text-[#878787] text-sm leading-relaxed mb-6">
              We've been notified and are looking into it. If this issue
              persists, please reach out to our support team.
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
