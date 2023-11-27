"use client";

import { TableCell, TableRow } from "@midday/ui/table";
import { usePathname, useRouter } from "next/navigation";

export function DataTableRow({ data }) {
  const router = useRouter();
  const pathname = usePathname();
  const handleNavigate = () => router.push(`${pathname}/${data.name}`);

  return (
    <TableRow className="h-[45px]" onClick={handleNavigate}>
      <TableCell>{data.name}</TableCell>
      <TableCell>{data.created_at}</TableCell>
      <TableCell>wef</TableCell>
    </TableRow>
  );
}
