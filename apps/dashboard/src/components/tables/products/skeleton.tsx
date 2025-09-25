import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";

export function ProductsSkeleton() {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
            <TableRow
              key={`skeleton-product-${id}`}
              className="hover:bg-transparent h-[65px]"
            >
              {/* Name column - matches the flex flex-col structure */}
              <TableCell>
                <div className="flex flex-col">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>

              {/* Price column - matches FormatAmount display */}
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>

              {/* Unit column - matches simple text display */}
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>

              {/* Usage column - matches number display */}
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>

              {/* Last Used column - matches relative time display */}
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>

              {/* Status column - matches Badge component */}
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>

              {/* Actions column - matches dropdown button */}
              <TableCell className="w-[50px]">
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
