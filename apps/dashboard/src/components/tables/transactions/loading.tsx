import { Skeleton } from "@midday/ui/skeleton";
import { DataTableHeader } from "./data-table-header";
import { DataTableCell, Row } from "./data-table-row";

const data = [...Array(25)].map((_, i) => ({ id: i.toString() }));

type Props = {
  collapsed: boolean;
};

export function Loading({ collapsed }) {
  return (
    <div
      className="border"
      style={{ width: collapsed ? "calc(100vw - 800px)" : "100%" }}
    >
      <DataTableHeader collapsed={collapsed} />

      {data?.map((row) => (
        <Row className="h-[45px]" key={row.id}>
          <DataTableCell className="w-[100px]">
            <Skeleton className="h-3.5 w-[40%]" />
          </DataTableCell>
          <DataTableCell className="w-[430px]">
            <Skeleton className="h-3.5 w-[70%]" />
          </DataTableCell>
          <DataTableCell className="w-[200px]">
            <Skeleton className="h-3.5 w-[50%]" />
          </DataTableCell>
          {!collapsed && (
            <>
              <DataTableCell className="w-[284px]">
                <Skeleton className="h-3.5 w-[40%]" />
              </DataTableCell>
              <DataTableCell className="w-[284px]">
                <div className="flex items-center space-x-2 w-[80%]">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-[70%]" />
                </div>
              </DataTableCell>
            </>
          )}
          <DataTableCell>
            <Skeleton className="h-3.5 w-[15px]" />
          </DataTableCell>
        </Row>
      ))}
    </div>
  );
}
