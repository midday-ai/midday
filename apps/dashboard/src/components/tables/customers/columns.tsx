"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

export type Customer = {
  id: string;
  name: string;
  customer_name?: string;
  website: string;
  contact_person?: string;
  email: string;
  invoices: number;
  projects: number;
  tags: { id: string; name: string }[];
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
    accessorKey: "contact_person",
    cell: ({ row }) => row.getValue("contact_person") ?? "-",
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    header: "Invoices",
    accessorKey: "invoices",
    cell: ({ row }) => row.getValue("invoices") ?? "-",
  },
  {
    header: "Projects",
    accessorKey: "projects",
    cell: ({ row }) => row.getValue("projects") ?? "-",
  },
  {
    header: "Tags",
    accessorKey: "tags",
    cell: ({ row }) => row.getValue("tags") ?? "-",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
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
