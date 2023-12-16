import { getSpending } from "@midday/supabase/cached-queries";
import Link from "next/link";
import { Category } from "../category";
import { spendingData } from "./data";
import { SpendingChart } from "./spending-chart";

function SpendingCategoryList({ categories }) {
  return (
    <ul className="absolute z-10 left-8 bottom-8 space-y-2">
      {categories.map(({ category }) => (
        <li key={category}>
          <Link href={`/transactions?filter=${JSON.stringify({ category })}`}>
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
  const { data, meta } = disabled
    ? spendingData
    : await getSpending(initialPeriod);

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#606060]">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <SpendingCategoryList categories={data} />
      <SpendingChart
        categories={data}
        currency={meta.currency}
        totalAmount={meta.totalAmount}
      />
    </>
  );
}
