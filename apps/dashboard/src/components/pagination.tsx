"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  page: number;
  className?: string;
  hasNextPage: boolean;
  basePath: string;
};

export function Pagination({ basePath, page, className, hasNextPage }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const createPaginationQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      router.push(`${basePath}/${page}?${params.toString()}`);
    },
    [searchParams],
  );

  return (
    <div className={cn(className, "flex justify-end space-x-2")}>
      <Button
        variant="icon"
        className="p-0"
        disabled={!page}
        onClick={() => createPaginationQuery(page - 1)}
      >
        <ChevronLeft size={22} />
      </Button>

      <Button
        variant="icon"
        className="p-0"
        disabled={!hasNextPage}
        onClick={() => createPaginationQuery(page + 1)}
      >
        <ChevronRight size={22} />
      </Button>
    </div>
  );
}
