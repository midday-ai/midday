"use client";

import { useUserContext } from "@/store/user/hook";
import { formatAmount } from "@/utils/format";
import { CategoryColor } from "../category";

type Props = {
  name: string;
  color: string;
  amount: number;
  currency: string;
  percentage: number;
};

export function SpendingCategoryItem({
  name,
  color,
  amount,
  currency,
  percentage,
}: Props) {
  const { locale } = useUserContext((state) => state.data);

  return (
    <div className="px-3 py-1 flex justify-between items-center space-x-12">
      <div className="text-sm font-medium flex items-center space-x-2">
        <CategoryColor name={name} color={color} />
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
