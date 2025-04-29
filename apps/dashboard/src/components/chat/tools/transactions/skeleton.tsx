import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";

export function TransactionsSkeleton() {
  return (
    <Table className="text-xs font-sans w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[45%] h-10">Description</TableHead>
          <TableHead className="h-10 min-w-[80px]">Date</TableHead>
          <TableHead className="h-10">Amount</TableHead>
          <TableHead className="h-10 text-right w-[50px]">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index.toString()} className="h-[34px]">
            <TableCell>
              <Skeleton className="h-4 w-[80%]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[60px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[50px]" />
            </TableCell>
            <TableCell className="flex justify-end">
              <Skeleton className="h-4 w-4 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
