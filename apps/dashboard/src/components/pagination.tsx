import { Button } from "@midday/ui/button";
import Link from "next/link";

type Props = {
  totalPages: number;
  page: number;
};

export function Pagination({ totalPages, page }: Props) {
  return (
    totalPages > page && (
      <Link href={`?page=${page + 1}`} scroll={false}>
        <Button variant="outline" className="w-full h-10">
          Load more
        </Button>
      </Link>
    )
  );
}
