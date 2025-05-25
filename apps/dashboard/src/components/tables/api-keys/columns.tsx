import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import * as React from "react";
import "@tanstack/react-table";
import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";

type ApiKey = RouterOutputs["apiKeys"]["get"][number];

const nameFilterFn: FilterFn<ApiKey> = (
  row: Row<ApiKey>,
  _: string,
  filterValue: string,
) => {
  const name = row.original.name?.toLowerCase();
  return name?.includes(filterValue.toLowerCase()) ?? false;
};

export const columns: ColumnDef<ApiKey>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    filterFn: nameFilterFn,
    cell: ({ row }) => {
      return <div>{row.original.name}</div>;
    },
  },
  {
    id: "user",
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return <span className="text-muted-foreground">-</span>;

      return (
        <div className="flex space-x-2 items-center">
          <Avatar className="h-6 w-6">
            {user.avatarUrl && (
              <AvatarImageNext
                src={user.avatarUrl}
                alt={user.fullName ?? ""}
                width={24}
                height={24}
              />
            )}
            <AvatarFallback className="text-xs">
              {user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {user.fullName?.split(" ").at(0) ?? "Unknown"}
          </span>
        </div>
      );
    },
  },
  {
    id: "permissions",
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      // Assuming permissions is an array of strings, e.g. ['read', 'write']
      const perms = row.original.permissions;
      if (!perms || perms.length === 0)
        return <span className="text-muted-foreground">None</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {perms.map((perm: string) => (
            <span
              key={perm}
              className="bg-muted px-2 py-0.5 rounded text-xs font-medium"
            >
              {perm.charAt(0).toUpperCase() + perm.slice(1)}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: "created",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return <span className="text-muted-foreground">-</span>;
      return (
        <span title={format(new Date(createdAt), "yyyy-MM-dd HH:mm:ss")}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    id: "lastUsed",
    accessorKey: "lastUsedAt",
    header: "Last Used",
    cell: ({ row }) => {
      const lastUsedAt = row.original.lastUsedAt;
      if (!lastUsedAt)
        return <span className="text-muted-foreground">Never</span>;
      return (
        <span title={format(new Date(lastUsedAt), "yyyy-MM-dd HH:mm:ss")}>
          {formatDistanceToNow(new Date(lastUsedAt), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const { toast } = useToast();
      const meta = table.options.meta;
      const trpc = useTRPC();
      const queryClient = useQueryClient();

      // Placeholder for delete logic
      return (
        <div className="flex justify-end">
          <div className="flex space-x-2 items-center">
            <Button variant="outline" size="icon">
              <Icons.Delete className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];
