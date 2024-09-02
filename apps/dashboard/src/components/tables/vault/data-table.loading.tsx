import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DataTableHeader } from "./date-table-header";

export function Loading() {
  return (
    <div className="mt-3 h-[calc(100vh-370px)] border overflow-scroll relative">
      <Table>
        <DataTableHeader />
        <TableBody className="border-r-0 border-l-0">
          {[...Array(20)].map((_, index) => (
            <TableRow
              className="h-[45px] cursor-default"
              key={index.toString()}
            >
              <TableCell>
                <Skeleton className="h-[20px] w-[20%]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-[20px] w-[25%]" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-24 h-7 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-[15px] w-[50%]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
