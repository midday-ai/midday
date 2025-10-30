import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import "@tanstack/react-table";
import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { scopesToName } from "@api/utils/scopes";
import { Badge } from "@midday/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { DeleteOAuthApplicationModal } from "../../modals/delete-oauth-application-modal";
import { OAuthApplicationStatusBadge } from "../../oauth-application-status-badge";

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
              className="h-6 w-6"
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
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
    header: "Permissions",
    cell: ({ row }) => {
      const scopes = row.original.scopes || [];

      return <Badge variant="tag">{scopesToName(scopes).name}</Badge>;
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <OAuthApplicationStatusBadge status={row.original.status} />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setParams } = useOAuthApplicationParams();
      const [showDeleteModal, setShowDeleteModal] = React.useState(false);

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
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DeleteOAuthApplicationModal
              applicationId={row.original.id}
              applicationName={row.original.name}
              isOpen={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            />
          </div>
        </div>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];
