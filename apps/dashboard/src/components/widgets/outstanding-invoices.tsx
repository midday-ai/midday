import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function OutstandingInvoicesWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const router = useRouter();

  const { data } = useQuery({
    ...trpc.widgets.getOutstandingInvoices.queryOptions({
      currency: team?.baseCurrency ?? undefined,
      status: ["unpaid", "overdue"],
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewInvoices = () => {
    router.push("/invoices?statuses=unpaid,overdue");
  };

  return (
    <BaseWidget
      title="Outstanding Invoices"
      icon={<Icons.Invoice className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            You currently have{" "}
            <span className="text-primary">
              {data?.result.count ?? 0} unpaid and{" "}
              {formatAmount({
                amount: data?.result.totalAmount ?? 0,
                currency: data?.result.currency ?? team?.baseCurrency ?? "USD",
              })}{" "}
              in outstanding invoices
            </span>
          </p>
        </div>
      }
      actions="View all invoices"
      onClick={handleViewInvoices}
    />
  );
}
