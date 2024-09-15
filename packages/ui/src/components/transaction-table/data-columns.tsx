"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "../checkbox";

import { Transaction } from "client-typescript-sdk";
import { removeUnderScores } from "../../lib/utils";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableFilter } from "./data-table-filters";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "accountId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">{row.getValue("accountId")}</div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "merchantName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Merchant" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("merchantName")}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "personalFinanceCategoryPrimary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {removeUnderScores(row.getValue("personalFinanceCategoryPrimary"))}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "authorizedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Authorized" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {new Date(row.getValue("authorizedDate")).toString().slice(0, 10)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column, table }) => (
      // <DataTableColumnHeader column={column} title="Amount" />
      <div className="flex flex-row items-center justify-center gap-2">
        <span>Amount</span>
        <DataTableFilter column={column} table={table} />
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            ${Math.abs(Number(row.getValue("amount"))).toFixed(2)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "locationCity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("locationCity")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "paymentChannel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Channel" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("paymentChannel")}
          </span>
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
