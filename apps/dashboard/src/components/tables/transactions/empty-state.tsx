"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";

export function EmptyState() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.EmptyState className="mb-4" />
        <div className="text-center mb-6">
          <h2 className="font-medium text-lg">No matches</h2>
          <p className="text-[#606060] text-sm">
            Try adjusting or removing filters
          </p>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
