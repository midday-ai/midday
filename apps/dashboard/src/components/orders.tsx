import { Suspense } from "react";
import { OrdersDataTable, OrdersSkeleton } from "./tables/orders";

export function Orders() {
  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Orders
      </h2>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersDataTable />
      </Suspense>
    </div>
  );
}
