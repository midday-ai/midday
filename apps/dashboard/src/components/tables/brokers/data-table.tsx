"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { BrokersEmptyState, BrokersNoResults } from "./empty-states";

export function BrokersDataTable() {
  const trpc = useTRPC();
  const [q] = useQueryState("q");
  const { params } = useSortParams();

  const { data } = useSuspenseQuery(
    trpc.brokers.get.queryOptions({
      sort: params.sort,
      q,
    }),
  );

  const brokers = data?.data ?? [];

  if (brokers.length === 0 && q) {
    return <BrokersNoResults />;
  }

  if (brokers.length === 0) {
    return <BrokersEmptyState />;
  }

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Name
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Company
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Email
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Status
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
              Active Deals
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
              Total Funded
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
              Commissions
            </th>
          </tr>
        </thead>
        <tbody>
          {brokers.map((broker) => (
            <tr
              key={broker.id}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/brokers/${broker.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {broker.name}
                </Link>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">
                {broker.companyName || "\u2014"}
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">
                {broker.email || "\u2014"}
              </td>
              <td className="py-3 px-4">
                <BrokerStatusBadge status={broker.status ?? "active"} />
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                {broker.activeDealCount}
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                ${Number(broker.totalFundedAmount).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                <span className="text-muted-foreground">
                  ${Number(broker.totalCommissionsEarned).toLocaleString()}
                </span>
                {broker.pendingCommissions > 0 && (
                  <span className="ml-1 text-xs text-amber-600">
                    (${Number(broker.pendingCommissions).toLocaleString()}{" "}
                    pending)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type BrokerStatusBadgeProps = {
  status: string;
};

function BrokerStatusBadge({ status }: BrokerStatusBadgeProps) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isActive
          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      )}
    >
      {status}
    </span>
  );
}
