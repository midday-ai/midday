import { TransactionDetails } from "@/components/transaction-details";
import { Skeleton } from "@midday/ui/skeleton";
import { DataTableHeader } from "./data-table-header";
import { DataTableCell, Row } from "./data-table-row";

const data = [...Array(40)].map((_, i) => ({ id: i.toString() }));

type Props = {
  collapsed: boolean;
};

export function Loading({ collapsed }) {
  return (
    <div className="flex relative space-x-8 cursor-default">
      <div
        className="border"
        style={{ width: collapsed ? "calc(100vw - 662px)" : "100%" }}
      >
        <DataTableHeader collapsed={collapsed} />

        {data?.map((row) => (
          <Row className="h-[45px]" key={row.id}>
            <DataTableCell className="w-[100px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </DataTableCell>
            <DataTableCell className="w-[430px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </DataTableCell>
            <DataTableCell className="w-[200px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </DataTableCell>
            {!collapsed && (
              <>
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
              </>
            )}

            <DataTableCell className="100px">
              <Skeleton className="h-[20px] w-[20px] rounded-full" />
            </DataTableCell>
          </Row>
        ))}
      </div>

      {collapsed && (
        <div className="h-full w-[480px] absolute top-0 right-0 bottom-0">
          <TransactionDetails />
        </div>
      )}
    </div>
  );
}
