"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { memo, useCallback } from "react";

export type Customer = RouterOutputs["customers"]["get"]["data"][number];

const NameCell = memo(
  ({ name, website }: { name: string | null; website: string | null }) => {
    if (!name) return "-";

    return (
      <div className="flex items-center space-x-2">
        <Avatar className="size-5">
          {website && (
            <AvatarImageNext
              src={getWebsiteLogo(website)}
              alt={`${name} logo`}
              width={20}
              height={20}
              quality={100}
            />
          )}
          <AvatarFallback className="text-[9px] font-medium">
            {name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{name}</span>
      </div>
    );
  },
);

NameCell.displayName = "NameCell";

const TagsCell = memo(
  ({ tags }: { tags?: { id: string; name: string | null }[] }) => (
    <div className="relative w-full">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
        {tags?.map((tag) => (
          <Link href={`/transactions?tags=${tag.id}`} key={tag.id}>
            <Badge
              variant="tag-rounded"
              className="whitespace-nowrap flex-shrink-0"
            >
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>
      <div className="absolute group-hover:hidden right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  ),
);

TagsCell.displayName = "TagsCell";

const ActionsCell = memo(
  ({
    customerId,
    onDelete,
  }: {
    customerId: string;
    onDelete?: (id: string) => void;
  }) => {
    const { setParams } = useCustomerParams();

    const handleEdit = useCallback(() => {
      setParams({ customerId });
    }, [customerId, setParams]);

    const handleDelete = useCallback(() => {
      onDelete?.(customerId);
    }, [customerId, onDelete]);

    return (
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="relative">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              Edit customer
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDelete} className="text-[#FF3638]">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Customer>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    size: 240,
    minSize: 180,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Name",
      className:
        "w-[240px] min-w-[180px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20 border-r border-border",
    },
    cell: ({ row }) => (
      <NameCell name={row.original.name} website={row.original.website} />
    ),
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: "Contact person",
    size: 180,
    minSize: 120,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Contact",
      className: "w-[180px] min-w-[120px]",
    },
    cell: ({ row }) => row.getValue("contact") ?? "-",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    size: 220,
    minSize: 150,
    maxSize: 350,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Email",
      className: "w-[220px] min-w-[150px]",
    },
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    id: "invoices",
    accessorKey: "invoices",
    header: "Invoices",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Invoices",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => {
      if (row.original.invoiceCount > 0) {
        return (
          <Link href={`/invoices?customers=${row.original.id}`}>
            {row.original.invoiceCount}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    id: "projects",
    accessorKey: "projects",
    header: "Projects",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Projects",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => {
      if (row.original.projectCount > 0) {
        return (
          <Link href={`/tracker?customers=${row.original.id}`}>
            {row.original.projectCount}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: "Tags",
    size: 280,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[280px] max-w-[280px]",
    },
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 100,
    maxSize: 100,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 !border-solid !border-l !border-l-border !border-r-0 !border-t-0 !border-b-0",
    },
    cell: ({ row, table }) => (
      <ActionsCell
        customerId={row.original.id}
        onDelete={table.options.meta?.deleteCustomer}
      />
    ),
  },
];
