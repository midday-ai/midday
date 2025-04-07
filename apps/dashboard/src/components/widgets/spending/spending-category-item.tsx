"use client";

import { CategoryColor } from "@/components/category";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";

type Props = {
  color: string;
  amount: number;
  currency: string;
  percentage: number;
};

export function SpendingCategoryItem({
  color,
  amount,
  currency,
  percentage,
}: Props) {
  const { data: user } = useUserQuery();

  return (
    <div className="px-3 py-1 flex justify-between items-center space-x-12">
      <div className="text-sm font-medium flex items-center space-x-2">
        <CategoryColor color={color} />

        <p>
          {amount &&
            formatAmount({
              amount: amount,
              currency,
              locale: user?.locale,
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
        </p>
      </div>

      <p className="text-sm text-[#606060] truncate">{percentage}%</p>
    </div>
  );
}
