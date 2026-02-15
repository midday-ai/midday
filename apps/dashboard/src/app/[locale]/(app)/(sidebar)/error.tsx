"use client";

import { Button } from "@midday/ui/button";
import { useEffect } from "react";
import { CopyInput } from "@/components/copy-input";
import { SUPPORT_EMAIL } from "@/utils/constants";

/**
 * Error boundary scoped to the (sidebar) layout.
 *
 * Because Next.js renders error boundaries *inside* the layout of the same
 * route segment, the sidebar and header stay visible while only the page
 * content is replaced with this error UI.
 */
export default function SidebarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
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

        <Button onClick={() => reset()} variant="outline" className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
