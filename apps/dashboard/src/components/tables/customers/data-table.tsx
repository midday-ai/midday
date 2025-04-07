"use client";

import { LoadMore } from "@/components/load-more";
import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody } from "@midday/ui/table";
import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useDeferredValue, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { columns } from "./columns";
import { CustomerRow } from "./row";
import { TableHeader } from "./table-header";

export function DataTable() {
  const { ref, inView } = useInView();
  const { setParams } = useCustomerParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { filter } = useCustomerFilterParams();
  const { params } = useSortParams();

  const deferredSearch = useDeferredValue(filter.q);

  const infiniteQueryOptions = trpc.customers.get.infiniteQueryOptions(
    {
      sort: params.sort,
      filter: {
        ...filter,
        q: deferredSearch,
      },
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

  const setOpen = (id?: string) => {
    if (id) {
      setParams({ customerId: id });
    } else {
      setParams(null);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      //   deleteCustomer: handleDeleteCustomer,
    },
  });

  return (
    <>
      <Table>
        <TableHeader />

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <CustomerRow key={row.id} row={row} setOpen={setOpen} />
          ))}
        </TableBody>
      </Table>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </>
  );
}
