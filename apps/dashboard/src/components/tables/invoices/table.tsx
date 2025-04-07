"use client";

import { deleteInvoiceAction } from "@/actions/invoice/delete-invoice-action";
import { LoadMore } from "@/components/load-more";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
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
  const { data: user } = useUserQuery();

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
      dateFormat: user?.date_format,
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

      <LoadMore ref={ref} hasNextPage={hasNextPage} />

      <InvoiceDetailsSheet
        data={selectedInvoice}
        isOpen={type === "details" && !!invoiceId}
        setOpen={setOpen}
      />
    </div>
  );
}
