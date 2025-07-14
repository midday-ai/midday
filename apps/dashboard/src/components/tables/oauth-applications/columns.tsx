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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { format } from "date-fns";
import { useCopyToClipboard } from "usehooks-ts";

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
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => {
      const updatedAt = row.original.updatedAt;
      if (!updatedAt) return <span className="text-muted-foreground">-</span>;

      return (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {format(new Date(updatedAt), "MMM d, yyyy")}
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
      const [, copy] = useCopyToClipboard();
      const [isCopied, setIsCopied] = React.useState(false);

      const handleCopyClientId = (e: React.MouseEvent) => {
        e.stopPropagation();
        copy(clientId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      };

      return (
        <TooltipProvider>
          <Tooltip open={isCopied}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopyClientId}
                className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {shortId}
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
              <p>Copied!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
