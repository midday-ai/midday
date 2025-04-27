import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { formatSize } from "@/utils/format";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
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
      return (
        <span className="font-medium text-sm">
          {row.original.title ?? row.original.name?.split("/").at(-1)}
        </span>
      );
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    cell: ({ row }) => {
      const { setFilter } = useDocumentFilterParams();

      return (
        <div className="relative">
          <div className="flex items-center space-x-2 w-[400px] overflow-x-auto scrollbar-hide">
            {row.original.tags?.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="tag-rounded"
                className="whitespace-nowrap"
                onClick={() => {
                  setFilter({ tags: [tag.id] });
                }}
              >
                {tag.name}
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
    cell: ({ row }) => {
      const { setParams } = useDocumentParams();

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
                setParams({ id: row.original.id });
              }}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: {
      className: "text-right",
    },
  },
];
