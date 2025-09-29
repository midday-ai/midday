import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";

export function OutstandingInvoicesWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const { data } = useQuery(
    trpc.widgets.getOutstandingInvoices.queryOptions({
      currency: team?.baseCurrency ?? undefined,
      status: ["unpaid", "overdue"],
    }),
  );

  const handleViewInvoices = () => {
    // TODO: Navigate to invoices page with unpaid filter
    console.log("View outstanding invoices clicked");
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
              outstanding in outstanding invoices
            </span>
          </p>
        </div>
      }
      actions="View all invoices"
      onClick={handleViewInvoices}
    />
  );
}
