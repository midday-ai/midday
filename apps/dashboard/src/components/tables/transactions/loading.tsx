import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { DataTable, DataTableHeader, DataTableRow } from "./data-table";

const data = [...Array(25)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return (
    <div className="rounded-md border">
      <Table>
        <DataTableHeader />
        <TableBody>
          {data?.map((row) => (
            <TableRow>
              <TableCell className="w-[380px]">
                <Skeleton className="h-3.5 w-[182px]" />
              </TableCell>
              <TableCell className="w-[170px]">
                <Skeleton className="h-3.5 w-[120px]" />
              </TableCell>
              <TableCell className="w-[250px]">
                <Skeleton className="h-3.5 w-[110px]" />
              </TableCell>
              <TableCell className="w-[280px]">
                <Skeleton className="h-3.5 w-[130px]" />
              </TableCell>
              <TableCell className="w-[180px]">
                <div className="flex items-center space-x-2 w-[120px]">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-[100px]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-[100px]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
