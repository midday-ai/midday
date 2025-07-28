"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { LoadMore } from "@/components/load-more";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useUserQuery } from "@/hooks/use-user";
import { useInvoiceStore } from "@/store/invoice";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
import { Table, TableBody } from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { use, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { columns } from "./columns";
import { NoResults } from "./empty-states";
import { EmptyState } from "./empty-states";
import { InvoiceRow } from "./row";
import { TableHeader } from "./table-header";

type Props = {
  columnVisibility: Promise<VisibilityState>;
};

export function DataTable({
  columnVisibility: columnVisibilityPromise,
}: Props) {
  const trpc = useTRPC();
  const { params } = useSortParams();
  const { filter, hasFilters } = useInvoiceFilterParams();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();

  const { setColumns } = useInvoiceStore();
  const initialColumnVisibility = use(columnVisibilityPromise);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );

  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 1,
  });

  const infiniteQueryOptions = trpc.invoice.get.infiniteQueryOptions(
    {
      sort: params.sort,
      ...filter,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data ?? []) ?? [];
  }, [data]);

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  useEffect(() => {
    updateColumnVisibilityAction({
      key: Cookies.InvoicesColumns,
      data: columnVisibility,
    });
  }, [columnVisibility]);

  const table = useReactTable({
    data: tableData,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
    meta: {
      dateFormat: user?.dateFormat,
      timeFormat: user?.timeFormat,
    },
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility]);

  if (hasFilters && !tableData?.length) {
    return <NoResults />;
  }

  if (!tableData?.length && !isFetching) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div
        ref={tableScroll.containerRef}
        className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide"
      >
        <Table>
          <TableHeader table={table} tableScroll={tableScroll} />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <InvoiceRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </div>
  );
}
