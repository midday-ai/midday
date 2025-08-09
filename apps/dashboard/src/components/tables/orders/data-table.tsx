"use client";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FormatAmount } from "../../format-amount";
import { OrderStatus } from "../../order-status";
import { ActionsMenu } from "./actions-menu";
import { OrdersTableHeader } from "./table-header";

export function OrdersDataTable() {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.billing.orders.queryOptions({
      pageSize: 12,
    }),
  );

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <OrdersTableHeader />
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="h-[45px]">
              <TableCell className="w-[120px] text-sm text-muted-foreground">
                {formatDate(order.createdAt, "MMM, yyyy", false)}
              </TableCell>
              <TableCell className="w-[100px] font-medium">
                <FormatAmount
                  amount={order.amount.amount / 100}
                  currency={order.amount.currency}
                />
              </TableCell>
              <TableCell className="w-[120px]">
                <OrderStatus status={order.status} />
              </TableCell>
              <TableCell className="w-[140px] text-sm">
                {order.product?.name || "N/A"}
              </TableCell>
              <TableCell className="w-[100px] text-right">
                <ActionsMenu order={order} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
