import { getSpending } from "@midday/supabase/cached-queries";
import Link from "next/link";
import { Category } from "../category";
import { spendingData } from "./data";
import { SpendingChart } from "./spending-chart";

function SpendingCategoryList({ categories, period }) {
  return (
    <ul className="absolute left-8 bottom-8 space-y-2 invisible xl:visible">
      {categories.map(({ category }) => (
        <li key={category}>
          <Link
            href={`/transactions?filter=${JSON.stringify({
              categories: [category],
              date: { from: period?.from, to: period?.to },
            })}`}
          >
            <Category
              key={category}
              name={category}
              className="text-sm text-[#606060] space-x-3"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function SpendingList({ initialPeriod, disabled }) {
  const spending = disabled ? spendingData : await getSpending(initialPeriod);

  if (!spending?.data?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#606060]">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <SpendingCategoryList
        categories={spending?.data}
        period={initialPeriod}
      />
      <SpendingChart
        disabled={disabled}
        categories={spending?.data}
        currency={spending?.meta.currency}
        totalAmount={spending?.meta.totalAmount}
      />
    </>
  );
}
