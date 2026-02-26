"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { SyndicationsEmptyState, SyndicationsNoResults } from "./empty-states";

export function SyndicationsDataTable() {
  const trpc = useTRPC();
  const [q] = useQueryState("q");

  const { data, isLoading } = useQuery(
    trpc.syndication.get.queryOptions({
      q,
    }),
  );

  const syndicators = data?.data ?? [];

  if (!isLoading && syndicators.length === 0 && q) {
    return <SyndicationsNoResults />;
  }

  if (!isLoading && syndicators.length === 0) {
    return <SyndicationsEmptyState />;
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
          </tr>
        </thead>
        <tbody>
          {syndicators.map((syndicator) => (
            <tr
              key={syndicator.id}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/syndications/${syndicator.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {syndicator.name}
                </Link>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">
                {syndicator.companyName || "\u2014"}
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">
                {syndicator.email || "\u2014"}
              </td>
              <td className="py-3 px-4">
                <SyndicatorStatusBadge
                  status={syndicator.status ?? "active"}
                />
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                {syndicator.activeDealCount}
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                ${Number(syndicator.totalFundingShare).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type SyndicatorStatusBadgeProps = {
  status: string;
};

function SyndicatorStatusBadge({ status }: SyndicatorStatusBadgeProps) {
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
