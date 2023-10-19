"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  page: number;
  className?: string;
  hasNextPage: boolean;
};

export function Pagination({ page, className, hasNextPage }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const createPaginationQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);

      if (page > 0) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`);
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
