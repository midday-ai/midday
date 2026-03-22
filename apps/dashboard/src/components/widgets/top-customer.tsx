import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function TopCustomerWidget() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getTopCustomer.queryOptions(),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Top Customer"
        icon={<Icons.Star className="size-4" />}
        descriptionLines={2}
        showValue={false}
      />
    );
  }

  return (
    <BaseWidget
      title="Top Customer"
      icon={<Icons.Star className="size-4" />}
      description={
        <p className="text-sm text-[#666666]">
          {data?.result?.customerName && data?.result?.currency ? (
            <>
              Your top customer is{" "}
              <span className="text-primary">
                {data.result.customerName} with{" "}
                <FormatAmount
                  amount={data.result.totalRevenue}
                  currency={data.result.currency}
                />{" "}
                from {data.result.invoiceCount} invoice
                {data.result.invoiceCount !== 1 ? "s" : ""} past 30 days
              </span>
            </>
          ) : (
            <>No top customer in the past 30 days</>
          )}
        </p>
      }
    />
  );
}
