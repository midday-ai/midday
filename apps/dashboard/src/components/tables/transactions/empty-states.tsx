"use client";

import { AddAccountButton } from "@/components/add-account-button";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

type Props = {
  hasFilters?: boolean;
};

export function NoResults({ hasFilters }: Props) {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            {hasFilters
              ? "Try another search, or adjusting the filters"
              : "There are no transactions imported yet"}
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

export function NoAccounts() {
  return (
    <div className="absolute w-full h-[calc(100vh-300px)] top-0 left-0 flex items-center justify-center z-20">
      <div className="text-center max-w-sm mx-auto flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium mb-2">Connect bank account</h2>
        <p className="text-sm text-[#878787] mb-6">
          Get instant transaction insights. Easily spot missing receipts,
          categorize expenses, and reconcile everything seamlessly for
          accounting.
        </p>

        <AddAccountButton />
      </div>
    </div>
  );
}
