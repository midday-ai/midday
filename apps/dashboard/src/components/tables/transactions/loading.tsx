import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody } from "@midday/ui/table";
import { DataTableHeader } from "./data-table-header";
import { DataTableCell, Row } from "./data-table-row";

const data = [...Array(40)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return (
    <Table>
      <DataTableHeader />

      <TableBody>
        {data?.map((row) => (
          <Row key={row.id}>
            <DataTableCell className="w-[100px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </DataTableCell>
            <DataTableCell className="w-[430px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </DataTableCell>
            <DataTableCell className="w-[200px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </DataTableCell>

            <DataTableCell className="w-[200px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </DataTableCell>
            <DataTableCell className="w-[150px]">
              <Skeleton className="h-3.5 w-[80px]" />
            </DataTableCell>
            <DataTableCell className="w-[200px]">
              <div className="flex items-center space-x-2 w-[80%]">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-3.5 w-[70%]" />
              </div>
            </DataTableCell>
            <DataTableCell className="100px">
              <Skeleton className="h-[20px] w-[20px] rounded-full" />
            </DataTableCell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
