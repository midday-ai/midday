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
      <div className="flex items-center justify-center w-full">
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
    size: 320,
    minSize: 240,
    maxSize: 500,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Name",
      className:
        "w-[320px] min-w-[240px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <NameCell name={row.original.name} website={row.original.website} />
    ),
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: "Contact person",
    size: 260,
    minSize: 180,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Contact",
      className: "w-[260px] min-w-[180px]",
    },
    cell: ({ row }) => row.getValue("contact") ?? "-",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    size: 300,
    minSize: 220,
    maxSize: 450,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Email",
      className: "w-[300px] min-w-[220px]",
    },
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    id: "invoices",
    accessorKey: "invoices",
    header: "Invoices",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Invoices",
      className: "w-[120px] min-w-[100px]",
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
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Projects",
      className: "w-[120px] min-w-[100px]",
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
    size: 320,
    minSize: 180,
    maxSize: 500,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[320px] min-w-[180px]",
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
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row, table }) => (
      <ActionsCell
        customerId={row.original.id}
        onDelete={table.options.meta?.deleteCustomer}
      />
    ),
  },
];
