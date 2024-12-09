"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@midday/ui/scroll-area";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

export type Customer = {
  id: string;
  name: string;
  customer_name?: string;
  website: string;
  contact?: string;
  email: string;
  invoices: { id: string }[];
  projects: { id: string }[];
  tags: { tag: { id: string; name: string } }[];
};

export const columns: ColumnDef<Customer>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      const name = row.original.name ?? row.original.customer_name;

      if (!name) return "-";

      return (
        <div className="flex items-center space-x-2">
          <Avatar className="size-5">
            {row.original.website && (
              <AvatarImageNext
                src={`https://img.logo.dev/${row.original.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`}
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
  },
  {
    header: "Contact person",
    accessorKey: "contact",
    cell: ({ row }) => row.getValue("contact") ?? "-",
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    header: "Invoices",
    accessorKey: "invoices",
    cell: ({ row }) => {
      if (row.original.invoices.length > 0) {
        return (
          <Link href={`/invoices?customers=${row.original.id}`}>
            {row.original.invoices.length}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    header: "Projects",
    accessorKey: "projects",
    cell: ({ row }) => {
      if (row.original.projects.length > 0) {
        return (
          <Link href={`/tracker?customers=${row.original.id}`}>
            {row.original.projects.length}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    header: "Tags",
    accessorKey: "tags",
    cell: ({ row }) => {
      return (
        <div className="relative">
          <ScrollArea className="max-w-[170px] whitespace-nowrap">
            <div className="flex items-center space-x-2">
              {row.original.tags?.map(({ tag }) => (
                <Link href={`/transactions?tags=${tag.id}`} key={tag.id}>
                  <Badge variant="tag" className="whitespace-nowrap">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const { setParams } = useCustomerParams();

      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="relative">
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setParams({
                    customerId: row.original.id,
                  })
                }
              >
                Edit customer
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  table.options.meta?.deleteCustomer(row.original.id)
                }
                className="text-[#FF3638]"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
