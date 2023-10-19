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
  count: number;
};

export function Pagination({
  page,
  className,
  count,
  to,
  from,
  hasNextPage,
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const formattedFrom = from + 1;
  const formattedTo = to + 1;

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
    <div className={cn(className, "flex items-center space-x-4 justify-end")}>
      <span className="text-sm text-[#606060]">
        {formattedFrom}-{formattedTo > count ? count : formattedTo} of {count}
      </span>
      <div className="flex space-x-2">
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
    </div>
  );
}
