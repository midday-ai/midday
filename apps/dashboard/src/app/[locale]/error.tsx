"use client";

import { Button } from "@midday/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="h-[calc(100vh-200px)] w-full">
      <div className="mt-8 flex flex-col items-center justify-center h-full">
        <div className="flex justify-between items-center flex-col mt-8 text-center mb-8">
          <h2 className="font-medium mb-4">Something went wrong</h2>
          <p className="text-sm text-[#878787]">
            An unexpected error has occurred. Please try again
            <br /> or contact support if the issue persists.
          </p>
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" asChild>
            <a href="/login">Go home</a>
          </Button>

          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>

          <Button asChild>
            <a href="mailto:support@abacuslabs.co">Contact us</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
