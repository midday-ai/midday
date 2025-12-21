"use client";

import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useFileUrl } from "@/hooks/use-file-url";
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
import { useState } from "react";

export type Document = RouterOutputs["documents"]["get"]["data"][number];

function DownloadFileMenuItem({
  pathTokens,
  filename,
}: {
  pathTokens?: string[] | null;
  filename: string;
}) {
  const { url: downloadUrl } = useFileUrl(
    pathTokens
      ? {
          type: "download",
          filePath: pathTokens.join("/"),
          filename,
        }
      : null,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!downloadUrl) return;

    try {
      setIsDownloading(true);
      await downloadFile(downloadUrl, filename);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDownload}
      disabled={!downloadUrl || isDownloading}
    >
      Download
    </DropdownMenuItem>
  );
}

export const columns: ColumnDef<Document>[] = [
  {
    id: "select",
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableResizing: false,
    enableHiding: false,
    enableSorting: false,
    meta: {
      sticky: true,
      skeleton: { type: "checkbox" },
      className:
        "w-[50px] min-w-[50px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
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
  },
  {
    id: "title",
    header: "Name",
    accessorKey: "title",
    size: 250,
    minSize: 180,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-52" },
      headerLabel: "Name",
      className:
        "w-[250px] min-w-[180px] md:sticky md:left-[50px] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
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
    header: "Tags",
    accessorKey: "tags",
    size: 280,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge", width: "w-20" },
      headerLabel: "Tags",
      className: "w-[280px] min-w-[200px]",
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
    header: "Size",
    accessorKey: "size",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-12" },
      headerLabel: "Size",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => {
      // @ts-expect-error - size is not typed (JSONB)
      return <span>{formatSize(row.original.metadata?.size)}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 80,
    maxSize: 100,
    enableResizing: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "w-[100px] min-w-[80px] md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row, table }) => {
      const { setParams } = useDocumentParams();

      if (!table.options.meta) {
        return null;
      }

      const { handleDelete, handleShare } = table.options.meta;

      return (
        <div className="flex items-center justify-center w-full">
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
              <DownloadFileMenuItem
                pathTokens={row.original.pathTokens}
                filename={row.original.name?.split("/").at(-1) || "download"}
              />
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
        </div>
      );
    },
  },
];
