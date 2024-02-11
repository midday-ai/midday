"use client";

import { TrackerCreateSheet } from "@/components/sheets/tracker-create-sheet";
import { TrackerSheet } from "@/components/sheets/tracker-sheet";
import { TrackerUpdateSheet } from "@/components/sheets/tracker-update-sheet";
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
  currencyCode,
  pageSize,
  meta,
  loadMore,
  user,
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

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString.withDefault(
        formatISO(new Date(), { representation: "date" })
      ),
      projectId: parseAsString,
      create: parseAsString,
      update: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const selectedProject = data.find(
    (project) => project.id === params?.projectId
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

      <TrackerSheet
        isOpen={Boolean(params.projectId) && !params.update}
        params={params}
        setParams={setParams}
        records={data}
        data={selectedProject}
        user={user}
      />

      <TrackerCreateSheet
        currencyCode={currencyCode}
        setParams={setParams}
        isOpen={Boolean(params.create)}
      />

      <TrackerUpdateSheet
        currencyCode={currencyCode}
        setParams={setParams}
        isOpen={Boolean(params.update)}
        data={selectedProject}
        key={selectedProject?.id}
      />

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
