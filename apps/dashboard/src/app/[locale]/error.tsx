"use client";

import { useCurrentLocale } from "@/locales/client";
import { Button } from "@midday/ui/button";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = useCurrentLocale();

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
            <Link href={`/${locale}`}>Go home</Link>
          </Button>

          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>

          <Button asChild>
            <Link href={`/${locale}/account/support`}>Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
