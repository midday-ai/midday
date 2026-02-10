import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import "@tanstack/react-table";
import { scopesToName } from "@api/utils/scopes";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { formatDistanceToNow } from "date-fns";
import { useTokenModalStore } from "@/store/token-modal";

type ApiKey = RouterOutputs["apiKeys"]["get"][number];

export const columns: ColumnDef<ApiKey>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return row.original.name;
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
    id: "scopes",
    accessorKey: "scopes",
    header: "Permissions",
    cell: ({ row }) => {
      return (
        <Badge variant="tag">{scopesToName(row.original.scopes).name}</Badge>
      );
    },
  },
  {
    id: "created",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;

      if (!createdAt) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <span>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    id: "lastUsed",
    accessorKey: "lastUsedAt",
    header: "Last used",
    meta: {
      className: "border-r-[0px]",
    },
    cell: ({ row }) => {
      const lastUsedAt = row.original.lastUsedAt;

      if (!lastUsedAt) {
        return <span className="text-muted-foreground">Never</span>;
      }

      return (
        <span>
          {formatDistanceToNow(new Date(lastUsedAt), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setData } = useTokenModalStore();

      return (
        <div className="flex justify-end">
          <div className="flex space-x-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Icons.MoreHoriz className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent sideOffset={10} align="end">
                <DropdownMenuItem onClick={() => setData(row.original, "edit")}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setData(row.original, "delete")}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];
