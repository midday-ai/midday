"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type Props = {
  page: number;
};

export function Pagination({ page }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isLoading, setLoading] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    setLoading(false);
  }, [page]);

  return (
    <Link
      href={`${pathname}?${createQueryString("page", page + 1)}`}
      scroll={false}
    >
      <Button
        variant="outline"
        className="w-full h-10"
        onClick={() => setLoading(true)}
      >
        {isLoading ? "Loading..." : "Load more"}
      </Button>
    </Link>
  );
}
