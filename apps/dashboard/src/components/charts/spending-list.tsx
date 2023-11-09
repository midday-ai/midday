import { getSpending } from "@midday/supabase/cached-queries";
import { Category } from "../category";
import { spendingData } from "./data";
import { SpendingChart } from "./spending-chart";

function SpendingCategoryList({ categories }) {
  return (
    <ul className="absolute left-8 bottom-8 space-y-2">
      {categories
        .sort((a, b) => a.amount - b.amount)
        .map(({ category }) => (
          <li key={category}>
            <Category
              key={category}
              name={category}
              className="text-sm text-[#606060] space-x-3"
            />
          </li>
        ))}
    </ul>
  );
}

export async function SpendingList({ initialPeriod, disabled }) {
  const { data, meta } = disabled
    ? spendingData
    : await getSpending(initialPeriod);

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
