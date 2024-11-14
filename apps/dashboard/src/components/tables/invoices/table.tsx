"use client";

import { deleteInvoiceAction } from "@/actions/invoice/delete-invoice-action";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserContext } from "@/store/user/hook";
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
import { type Invoice, columns } from "./columns";
import { InvoiceRow } from "./row";
import { TableHeader } from "./table-header";

type Props = {
  data: Invoice[];
  loadMore: ({
    from,
    to,
  }: {
    from: number;
    to: number;
  }) => Promise<{ data: Invoice[]; meta: { count: number } }>;
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
  const { setParams, invoiceId, type } = useInvoiceParams();

  const deleteInvoice = useAction(deleteInvoiceAction);
  const { date_format: dateFormat } = useUserContext((state) => state.data);

  const selectedInvoice = data.find((invoice) => invoice?.id === invoiceId);

  const setOpen = (id?: string) => {
    if (id) {
      setParams({ type: "details", invoiceId: id });
    } else {
      setParams(null);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setData((prev) => {
      return prev.filter((item) => item.id !== id);
    });

    deleteInvoice.execute({ id });
  };

  const table = useReactTable({
    data,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteInvoice: handleDeleteInvoice,
      dateFormat,
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
            <InvoiceRow key={row.id} row={row} setOpen={setOpen} />
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

      <InvoiceDetailsSheet
        data={selectedInvoice}
        isOpen={type === "details" && !!invoiceId}
        setOpen={setOpen}
      />
    </div>
  );
}
