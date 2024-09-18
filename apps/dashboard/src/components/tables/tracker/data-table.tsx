"use client";

import { Button } from "@midday/ui/button";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody } from "@midday/ui/table";
import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
  teamId?: string;
  initialDate: string;
  currencyCode?: string;
};

export function DataTable({
  data: initialData,
  pageSize,
  meta,
  loadMore,
}: ItemsProps) {
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

  const [params, setParams] = useQueryStates({
    day: parseAsString.withDefault(
      formatISO(new Date(), { representation: "date" }),
    ),
    projectId: parseAsString,
    create: parseAsString,
    update: parseAsString,
  });

  const selectedProject = data.find(
    (project) => project.id === params?.projectId,
  );

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
            <DataTableRow row={row} setParams={setParams} key={row.id} />
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
