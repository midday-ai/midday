import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { OrdersTableHeader } from "./table-header";

export function OrdersSkeleton() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto md:border-l md:border-r border-border">
        <Table>
          <OrdersTableHeader />
          <TableBody className="border-l-0 border-r-0 border-t-0 border-b-0">
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index.toString()} className="h-[45px]">
                <TableCell className="w-[140px]">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-[120px]">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="w-[100px]">
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell className="w-[120px]">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="w-[140px]">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="w-[100px] text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
