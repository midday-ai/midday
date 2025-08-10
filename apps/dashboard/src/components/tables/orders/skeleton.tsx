import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { OrdersTableHeader } from "./table-header";

export function OrdersSkeleton() {
  return (
    <div className="w-full">
      <Table>
        <OrdersTableHeader />
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index.toString()} className="h-[45px]">
              <TableCell className="w-[120px] text-sm text-muted-foreground">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="w-[100px] font-medium">
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell className="w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="w-[140px] text-sm">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="w-[100px] text-right" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
