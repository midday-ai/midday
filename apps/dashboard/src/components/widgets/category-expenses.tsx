"use client";

import { useTRPC } from "@/trpc/client";
import { formatCompactAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function CategoryExpensesWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  const now = new Date();
  const from = format(startOfMonth(now), "yyyy-MM-dd");
  const to = format(endOfMonth(now), "yyyy-MM-dd");

  const { data } = useQuery({
    ...trpc.widgets.getCategoryExpenses.queryOptions({
      from,
      to,
      limit: 3,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const categoryData = data?.result;
  const categories = categoryData?.categories || [];
  const maxAmount = categories[0]?.amount || 0;

  const hasCategories = categoryData && categories.length > 0;

  const handleViewCategories = () => {
    if (!hasCategories) return;
    router.push(
      `/transactions?categories=${categories.map((category) => category.slug).join(",")}&start=${from}&end=${to}`,
    );
  };

  return (
    <BaseWidget
      title="Category Expenses"
      description={
        hasCategories ? (
          <div className="flex flex-col gap-2 w-full">
            {categories.map((category, index) => {
              const percentage =
                maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;

              const barColor =
                index === 0
                  ? "bg-primary"
                  : index === 1
                    ? "bg-[#A0A0A0]"
                    : "bg-[#606060]";

              return (
                <div key={category.slug} className="flex items-center gap-3">
                  <span className="text-xs text-[#878787] truncate w-[110px] shrink-0">
                    {category.name}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className={`h-full ${barColor}`} />
                    </div>
                    <span className="text-xs shrink-0 tabular-nums">
                      {formatCompactAmount(category.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8">
            <p className="text-sm text-muted-foreground">
              No expenses tracked yet
            </p>
          </div>
        )
      }
      icon={<Icons.PieChart className="size-4" />}
      onClick={hasCategories ? handleViewCategories : undefined}
      actions={hasCategories ? "View transactions" : undefined}
    />
  );
}
