"use client";

import { CopyInput } from "@/components/copy-input";
import { Button } from "@midday/ui/button";
import { useEffect } from "react";

const SUPPORT_EMAIL = "support@midday.ai";

export default function ErrorPage({
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
    <div className="h-[calc(100vh-200px)] w-full">
      <div className="mt-8 flex flex-col items-center justify-center h-full">
        <div className="flex justify-between items-center flex-col mt-8 text-center mb-8">
          <h2 className="font-medium mb-4">Something went wrong</h2>
          <p className="text-sm text-[#878787]">
            We've been notified and are looking into it.
            <br />
            If this issue persists, please reach out to our support team.
          </p>
        </div>

        <CopyInput value={SUPPORT_EMAIL} />

        <div className="flex space-x-4 mt-6">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
