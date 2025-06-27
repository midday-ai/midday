import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { downloadFile } from "@/lib/download";
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
    meta: {
      className:
        "sticky left-0 bg-background group-hover:bg-muted z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
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
    meta: {
      className:
        "w-[250px] min-w-[250px] sticky left-[50px] bg-background group-hover:bg-muted z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const isLoading = row.original.processingStatus === "pending";

      if (isLoading) {
        return <Skeleton className="w-52 h-4" />;
      }

      return (
        <div className="truncate">
          {row.original.title ?? row.original.name?.split("/").at(-1)}
        </div>
      );
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    meta: {
      className: "w-[280px] max-w-[280px]",
    },
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
        <div className="relative w-full">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            {row.original.documentTagAssignments?.map(({ documentTag }) => (
              <Badge
                key={documentTag.id}
                variant="tag-rounded"
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => {
                  setFilter({ tags: [documentTag.id] });
                }}
              >
                {documentTag.name}
              </Badge>
            ))}
          </div>
          <div className="absolute group-hover:hidden right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
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
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await downloadFile(
                    `/api/download/file?path=${row.original.pathTokens?.join("/")}&filename=${row.original.name?.split("/").at(-1)}`,
                    row.original.name?.split("/").at(-1) || "download",
                  );
                } catch (error) {
                  console.error("Download failed:", error);
                }
              }}
            >
              Download
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
      className:
        "text-right sticky right-0 bg-background group-hover:bg-muted z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
  },
];
