import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function OutstandingInvoicesWidget() {
  const trpc = useTRPC();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getOutstandingInvoices.queryOptions({
      currency: currency,
      status: ["unpaid", "overdue"],
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Outstanding Invoices"
        icon={<Icons.Invoice className="size-4" />}
        descriptionLines={2}
        showValue={false}
      />
    );
  }

  return (
    <BaseWidget
      title="Outstanding Invoices"
      icon={<Icons.Invoice className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          {data?.result ? (
            <p className="text-sm text-[#666666]">
              You currently have{" "}
              <span className="text-primary">
                {data.result.count} unpaid and{" "}
                <FormatAmount
                  amount={data.result.totalAmount}
                  currency={currency || "USD"}
                />{" "}
                in outstanding invoices
              </span>
            </p>
          ) : (
            <p className="text-sm text-[#666666]">
              You currently have{" "}
              <span className="text-primary">0 unpaid invoices</span>
            </p>
          )}
        </div>
      }
    />
  );
}
