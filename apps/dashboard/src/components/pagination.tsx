"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type Props = {
  page: number;
};

export function Pagination({ page }: Props) {
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [page]);

  return (
    <Link href={`?page=${page + 1}`} scroll={false}>
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
