"use client";

import { deleteCustomerAction } from "@/actions/delete-customer-action";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody } from "@midday/ui/table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { type Customer, columns } from "./columns";
import { CustomerRow } from "./row";
import { TableHeader } from "./table-header";

type Props = {
  data: Customer[];
  loadMore: ({
    from,
    to,
  }: {
    from: number;
    to: number;
  }) => Promise<{ data: Customer[]; meta: { count: number } }>;
  pageSize: number;
  hasNextPage: boolean;
};

export function DataTable({
  data: initialData,
  loadMore,
  pageSize,
  hasNextPage: initialHasNextPage,
}: Props) {
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(pageSize);
  const { ref, inView } = useInView();
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const { setParams } = useCustomerParams();

  const deleteCustomer = useAction(deleteCustomerAction);

  const setOpen = (id?: string) => {
    if (id) {
      setParams({ customerId: id });
    } else {
      setParams(null);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setData((prev) => {
      return prev.filter((item) => item.id !== id);
    });

    deleteCustomer.execute({ id });
  };

  const table = useReactTable({
    data,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteCustomer: handleDeleteCustomer,
    },
  });

  const loadMoreData = async () => {
    const formatedFrom = from;
    const to = formatedFrom + pageSize * 2;

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

  useEffect(() => {
    if (inView) {
      loadMoreData();
    }
  }, [inView]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <div>
      <Table>
        <TableHeader />

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <CustomerRow key={row.id} row={row} setOpen={setOpen} />
          ))}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex items-center justify-center mt-6" ref={ref}>
          <div className="flex items-center space-x-2 px-6 py-5">
            <Spinner />
            <span className="text-sm text-[#606060]">Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
}
