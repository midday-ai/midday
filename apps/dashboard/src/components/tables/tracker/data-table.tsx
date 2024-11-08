"use client";

import { Button } from "@midday/ui/button";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody } from "@midday/ui/table";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

export type TrackerProject = {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed";
  total_duration: number;
  estimate?: number;
  rate?: number;
  currency?: string;
  customer?: {
    id: string;
    name: string;
    website: string;
  };
  users: {
    id: string;
    full_name: string;
    avatar_url?: string;
  }[];
};

type DataTableProps = {
  data: TrackerProject[];
  pageSize: number;
  userId: string;
  meta: {
    count: number;
  };
  loadMore: (params: { from: number; to: number }) => Promise<{
    data: TrackerProject[];
    meta: { count: number };
  }>;
};

export function DataTable({
  data: initialData,
  pageSize,
  meta,
  loadMore,
  userId,
}: DataTableProps) {
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(pageSize);
  const { ref, inView } = useInView();
  const [hasNextPage, setHasNextPage] = useState(meta.count > pageSize);

  useEffect(() => {
    if (inView) {
      loadMoreData();
    }
  }, [inView]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const loadMoreData = async () => {
    const formatedFrom = from;
    const to = formatedFrom + pageSize;

    try {
      const { data, meta } = await loadMore({
        from: formatedFrom,
        to,
      });

      setData((prev) => [...prev, ...data]);
      setFrom(to);
      setHasNextPage(meta.count > to);
    } catch {
      setHasNextPage(false);
    }
  };

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {data.map((row) => (
            <DataTableRow row={row} key={row.id} userId={userId} />
          ))}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex items-center justify-center mt-6" ref={ref}>
          <Button variant="outline" className="space-x-2 px-6 py-5">
            <Spinner />
            <span className="text-sm text-[#606060]">Loading more...</span>
          </Button>
        </div>
      )}
    </>
  );
}
