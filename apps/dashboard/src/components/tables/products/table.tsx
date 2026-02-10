"use client";

import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useProductParams } from "@/hooks/use-product-params";
import { useTRPC } from "@/trpc/client";
import { columns } from "./columns";
import { Header } from "./header";

export function DataTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useProductParams();

  const { data } = useSuspenseQuery(
    trpc.invoiceProducts.get.queryOptions({
      sortBy: "recent",
      limit: 100,
      includeInactive: true,
    }),
  );

  const deleteProductMutation = useMutation(
    trpc.invoiceProducts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
      },
    }),
  );

  const table = useReactTable({
    data: data ?? [],
    getRowId: (row) => row.id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    meta: {
      handleDelete: (id: string) => {
        deleteProductMutation.mutate({ id });
      },
      onEdit: (id: string) => {
        setParams({ productId: id });
      },
    },
  });

  return (
    <div className="w-full">
      <Header table={table} />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className="hover:bg-muted/50 cursor-pointer"
              key={row.id}
              onClick={() => setParams({ productId: row.original.id })}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    index === table.getAllColumns().length - 1 && "w-[50px]",
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-12 border border-border border-t-0 min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No products found</p>
        </div>
      )}
    </div>
  );
}
