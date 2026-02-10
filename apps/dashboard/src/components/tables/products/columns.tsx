"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { memo, useCallback } from "react";
import { FormatAmount } from "@/components/format-amount";

export type Product = RouterOutputs["invoiceProducts"]["get"][number];

const ActionsCell = memo(
  ({
    product,
    onEdit,
    onDelete,
  }: {
    product: Product;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const handleEdit = useCallback(() => {
      onEdit(product.id);
    }, [product, onEdit]);

    const handleDelete = useCallback(() => {
      onDelete(product.id);
    }, [product.id, onDelete]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.description && (
          <span className="text-sm text-muted-foreground">
            {row.original.description}
          </span>
        )}
      </div>
    ),
    filterFn: (row, _, value) => {
      const name = row.original.name?.toLowerCase() || "";
      const description = row.original.description?.toLowerCase() || "";
      const searchValue = value.toLowerCase();
      return name.includes(searchValue) || description.includes(searchValue);
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price;
      const currency = row.original.currency;

      if (!price) {
        return <span className="text-muted-foreground">-</span>;
      }

      return <FormatAmount amount={price} currency={currency || "USD"} />;
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => {
      const unit = row.original.unit;
      return unit ? (
        <span>{unit}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "usageCount",
    header: "Usage",
    cell: ({ row }) => {
      const count = row.original.usageCount;
      return <span>{count}</span>;
    },
  },
  {
    accessorKey: "lastUsedAt",
    header: "Last Used",
    cell: ({ row }) => {
      const lastUsedAt = row.original.lastUsedAt;

      if (!lastUsedAt) {
        return "-";
      }

      return (
        <span className="text-sm">
          {formatDistanceToNow(new Date(lastUsedAt), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant="outline">{isActive ? "Active" : "Inactive"}</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onEdit: (id: string) => void;
        handleDelete: (id: string) => void;
      };

      return (
        <ActionsCell
          product={row.original}
          onEdit={meta.onEdit}
          onDelete={meta.handleDelete}
        />
      );
    },
  },
];
