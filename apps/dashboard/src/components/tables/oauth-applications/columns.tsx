import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import "@tanstack/react-table";
import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { Badge } from "@midday/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";

type OAuthApplication =
  RouterOutputs["oauthApplications"]["list"]["data"][number];

export const columns: ColumnDef<OAuthApplication>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          {row.original.logoUrl && (
            <img
              src={row.original.logoUrl}
              alt={row.original.name}
              className="h-6 w-6 rounded"
            />
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      );
    },
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description;
      if (!description) return <span className="text-muted-foreground">-</span>;

      return (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {description}
        </span>
      );
    },
  },
  {
    id: "clientId",
    accessorKey: "clientId",
    header: "Client ID",
    cell: ({ row }) => {
      const clientId = row.original.clientId;
      const shortId = `${clientId.slice(0, 12)}...`;

      return (
        <span className="font-mono text-sm text-muted-foreground">
          {shortId}
        </span>
      );
    },
  },
  {
    id: "scopes",
    accessorKey: "scopes",
    header: "Scopes",
    cell: ({ row }) => {
      const scopes = row.original.scopes;
      const scopeCount = scopes?.length || 0;

      return (
        <Badge variant="tag">
          {scopeCount} scope{scopeCount !== 1 ? "s" : ""}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setParams } = useOAuthApplicationParams();

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
                <DropdownMenuItem
                  onClick={() =>
                    setParams({
                      applicationId: row.original.id,
                      editApplication: true,
                    })
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setParams({ applicationId: row.original.id })}
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
