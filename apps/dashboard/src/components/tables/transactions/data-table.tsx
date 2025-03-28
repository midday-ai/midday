"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { Tooltip, TooltipProvider } from "@midday/ui/tooltip";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { ExportBar } from "./export-bar";

export function DataTable({
  initialColumnVisibility,
}: { initialColumnVisibility?: VisibilityState }) {
  const { filter } = useTransactionFilterParams();
  const { setRowSelection, rowSelection, setColumns, setCanDelete } =
    useTransactionsStore();

  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();
  const { ref, inView } = useInView();

  const trpc = useTRPC();
  const { setTransactionId } = useTransactionParams();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );

  const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
    {
      filter: {
        ...filter,
        q: deferredSearch,
      },
      sort: params.sort,
    },
    {
      getNextPageParam: ({ meta }) => {
        return meta?.cursor ?? undefined;
      },
    },
  );

  const { data, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    },
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility]);

  useEffect(() => {
    updateColumnVisibilityAction({
      key: Cookies.TransactionsColumns,
      data: columnVisibility,
    });
  }, [columnVisibility]);

  return (
    <div className="relative">
      <TooltipProvider delayDuration={20}>
        <Tooltip>
          <Table>
            <DataTableHeader table={table} />

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-[40px] md:h-[45px] cursor-pointer select-text"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={() => {
                          if (
                            cell.column.id !== "select" &&
                            cell.column.id !== "actions"
                          ) {
                            setTransactionId(row.original.id);
                          }
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="flex items-center justify-center mt-6" ref={ref}>
              <div className="flex items-center space-x-2 py-5">
                <Spinner />
                <span className="text-sm text-[#606060]">Loading more...</span>
              </div>
            </div>
          )}
        </Tooltip>
      </TooltipProvider>

      <ExportBar />
    </div>
  );
}
