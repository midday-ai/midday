import { getSpending } from "@midday/supabase/cached-queries";
import { spendingData } from "./data";
import { SpendingCategoryList } from "./spending-category-list";

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
    <SpendingCategoryList categories={spending?.data} period={initialPeriod} />
  );
}
