"use client";

import { Spinner } from "@midday/ui/spinner";
import type { ForwardedRef } from "react";

export function LoadMore({
  hasNextPage,
  ref,
}: {
  hasNextPage: boolean;
  ref: ForwardedRef<HTMLDivElement>;
}) {
  if (!hasNextPage) return null;

  return (
    <div className="flex items-center justify-center mt-6" ref={ref}>
      <div className="flex items-center space-x-2 py-5">
        <Spinner />
        <span className="text-sm text-[#606060]">Loading more...</span>
      </div>
    </div>
  );
}
