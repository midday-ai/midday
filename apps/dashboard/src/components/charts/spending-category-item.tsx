"use client";

import { useCurrentLocale } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import { CategoryColor } from "../category";

type Props = {
  category: string;
  amount: number;
  currency: string;
  percentage: number;
};

export function SpendingCategoryItem({
  category,
  amount,
  currency,
  percentage,
}: Props) {
  const locale = useCurrentLocale();

  return (
    <div className="px-3 py-1 flex justify-between items-center space-x-12">
      <div className="text-sm font-medium flex items-center space-x-2">
        {category && <CategoryColor name={category} system />}
        <p>
          {amount &&
            formatAmount({
              amount: amount,
              currency,
              locale,
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
        </p>
      </div>
      <p className="text-sm text-[#606060] truncate">{percentage}%</p>
    </div>
  );
}
