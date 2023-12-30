"use client";

import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Input } from "@midday/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { cn } from "@midday/ui/utils";
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: "team",
    cell: ({ row }) => {
      return (
        <div>
          <div className="flex items-center space-x-4">
            <Avatar className="rounded-full w-8 h-8">
              <AvatarImage src={row.original.team?.logo_url} />
              <AvatarFallback>
                <span className="text-xs">
                  {row.original.team.name?.charAt(0)?.toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {row.original.team.name}
              </span>
              <span className="text-sm text-[#606060]">
                {row.original.role}
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <Button variant="outline">View</Button>
            <Button variant="outline">Manage</Button>
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];

export function TeamsTable({ data }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <Dialog>
      <div className="w-full">
        <div className="flex items-center pb-4 space-x-4">
          <Input
            placeholder="Search..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
          />
          <DialogTrigger asChild>
            <Button>Create</Button>
          </DialogTrigger>
          <CreateTeamModal />
        </div>
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "border-r-[0px] py-4",
                        cell.column.columnDef.meta?.className
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
      </div>
    </Dialog>
  );
}
