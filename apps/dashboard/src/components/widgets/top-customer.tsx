import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function TopCustomerWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const { data } = useQuery({
    ...trpc.widgets.getTopCustomer.queryOptions(),
    ...WIDGET_POLLING_CONFIG,
  });

  return (
    <BaseWidget
      title="Top Customer"
      icon={<Icons.Star className="size-4" />}
      description={
        <p className="text-sm text-[#666666]">
          {data?.result?.customerName ? (
            <>
              Your top customer is{" "}
              <span className="text-primary">
                {data.result.customerName} with{" "}
                {formatAmount({
                  amount: data.result.totalRevenue ?? 0,
                  currency: data.result.currency ?? team?.baseCurrency!,
                })}{" "}
                from {data.result.invoiceCount} invoice
                {data.result.invoiceCount !== 1 ? "s" : ""} past 30 days
              </span>
            </>
          ) : (
            <>No top customer in the past 30 days</>
          )}
        </p>
      }
      actions="View top customer"
    />
  );
}
