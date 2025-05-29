import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { formatSize } from "@/utils/format";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Skeleton } from "@midday/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

type Document = RouterOutputs["documents"]["get"]["data"][number];

export const columns: ColumnDef<Document>[] = [
  {
    id: "select",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          if (checked === "indeterminate") {
            row.toggleSelected();
          } else {
            row.toggleSelected(checked);
          }
        }}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "title",
    accessorKey: "title",
    cell: ({ row }) => {
      const isLoading = row.original.processingStatus === "pending";

      if (isLoading) {
        return <Skeleton className="w-52 h-4" />;
      }

      return row.original.title ?? row.original.name?.split("/").at(-1);
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    cell: ({ row }) => {
      const { setFilter } = useDocumentFilterParams();

      const isLoading = row.original.processingStatus === "pending";

      if (isLoading) {
        return (
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        );
      }

      return (
        <div className="relative">
          <div className="flex items-center space-x-2 w-[400px] overflow-x-auto scrollbar-hide">
            {row.original.documentTagAssignments?.map(({ documentTag }) => (
              <Badge
                key={documentTag.id}
                variant="tag-rounded"
                className="whitespace-nowrap"
                onClick={() => {
                  setFilter({ tags: [documentTag.id] });
                }}
              >
                {documentTag.name}
              </Badge>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      );
    },
  },
  {
    id: "size",
    accessorKey: "size",
    cell: ({ row }) => {
      // @ts-expect-error - size is not typed (JSONB)
      return <span>{formatSize(row.original.metadata?.size)}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const { setParams } = useDocumentParams();

      if (!table.options.meta) {
        return null;
      }

      const { handleDelete, handleShare } = table.options.meta;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setParams({ documentId: row.original.id });
              }}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <a
                href={`/api/download/file?path=${row.original.pathTokens?.join(
                  "/",
                )}&filename=${row.original.name?.split("/").at(-1)}`}
                download
              >
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (row.original.pathTokens) {
                  handleShare?.(row.original.pathTokens);
                }
              }}
              disabled={!row.original.pathTokens}
            >
              Copy link
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                handleDelete?.(row.original.id);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];
