"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Skeleton } from "@midday/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useFileUrl } from "@/hooks/use-file-url";
import { downloadFile } from "@/lib/download";
import { isStaleProcessing } from "@/utils/document";
import { formatSize } from "@/utils/format";

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
      // @ts-expect-error - mimetype is not typed (JSONB)
      const mimetype = row.original.metadata?.mimetype as string | undefined;
      const isSupported = mimetype
        ? isMimeTypeSupportedForProcessing(mimetype)
        : false;

      const isFailed = row.original.processingStatus === "failed";
      // Document completed but AI classification failed - title is null
      const needsClassification =
        row.original.processingStatus === "completed" && !row.original.title;
      // Get display name - fallback to filename from path
      const displayName =
        row.original.title ?? row.original.name?.split("/").at(-1);

      // Check if document is stuck in processing (pending for >10 minutes since creation)
      const staleProcessing = isStaleProcessing(
        row.original.processingStatus,
        row.original.createdAt,
      );

      // Show skeleton only for recently pending documents (not stale ones)
      const isLoading =
        row.original.processingStatus === "pending" && !staleProcessing;

      if (isLoading) {
        return <Skeleton className="w-52 h-4" />;
      }

      return (
        <span
          className={cn(
            "truncate",
            isSupported && isFailed && "text-destructive",
            isSupported &&
              (needsClassification || staleProcessing) &&
              "text-amber-600 dark:text-amber-500",
          )}
        >
          {displayName}
        </span>
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

      // Check if document is stuck in processing (pending for >10 minutes since creation)
      const staleProcessing = isStaleProcessing(
        row.original.processingStatus,
        row.original.createdAt,
      );

      // Show skeleton only for recently pending documents (not stale ones)
      const isLoading =
        row.original.processingStatus === "pending" && !staleProcessing;

      if (isLoading) {
        return (
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
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

      // @ts-expect-error - mimetype is not typed (JSONB)
      const mimetype = row.original.metadata?.mimetype as string | undefined;
      const isSupported = mimetype
        ? isMimeTypeSupportedForProcessing(mimetype)
        : false;

      const isFailed = row.original.processingStatus === "failed";
      // Document completed but AI classification failed - title is null
      const needsClassification =
        row.original.processingStatus === "completed" && !row.original.title;
      // Check if document is stuck in processing (pending for >10 minutes since creation)
      const staleProcessing = isStaleProcessing(
        row.original.processingStatus,
        row.original.createdAt,
      );
      // Show retry option only for supported file types
      const showRetry =
        isSupported && (isFailed || needsClassification || staleProcessing);

      if (!table.options.meta) {
        return null;
      }

      const { handleDelete, handleShare, handleReprocess } = table.options.meta;

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

              {showRetry && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      handleReprocess?.(row.original.id);
                    }}
                  >
                    Re-analyze document
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
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
