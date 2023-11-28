"use client";

import { FileIcon } from "@/components/file-icon";
import { formatSize } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { TableCell, TableRow } from "@midday/ui/table";
import { format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";

export function DataTableRow({ data }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = () => router.push(`${pathname}/${data.name}`);

  return (
    <TableRow className="h-[45px]" onClick={handleNavigate}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <FileIcon mimetype={data?.metadata?.mimetype} name={data.name} />
          <span>{data.name}</span>
          {data?.metadata?.size && (
            <span className="text-[#878787]">
              {formatSize(data.metadata.size)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {data?.created_at && format(new Date(data.created_at), "MMM d, yyyy")}
      </TableCell>
      <TableCell>
        <Icons.MoreHoriz size={16} />
      </TableCell>
    </TableRow>
  );
}
