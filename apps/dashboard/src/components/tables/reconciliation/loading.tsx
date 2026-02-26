import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";

export function Loading() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: 40 }} />
          <TableHead style={{ width: 100 }}>Date</TableHead>
          <TableHead style={{ width: 250 }}>Description</TableHead>
          <TableHead style={{ width: 120 }}>Amount</TableHead>
          <TableHead style={{ width: 130 }}>Status</TableHead>
          <TableHead style={{ width: 160 }}>Matched Deal</TableHead>
          <TableHead style={{ width: 120 }}>Confidence</TableHead>
          <TableHead style={{ width: 120 }}>Bank</TableHead>
          <TableHead style={{ width: 50 }} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 20 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-1.5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-6 rounded" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
