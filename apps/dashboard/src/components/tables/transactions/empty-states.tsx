"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

export function NoResults({ hasFilters }) {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => router.push("/transactions")}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function NoAccountConnected() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Bank className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No account connected</h2>
          <p className="text-[#606060] text-sm">
            To show your transactions we first need <br />
            to connect your bank account.
          </p>
        </div>

        <Button variant="outline" onClick={() => router.push("/onboarding")}>
          Get started
        </Button>
      </div>
    </div>
  );
}
