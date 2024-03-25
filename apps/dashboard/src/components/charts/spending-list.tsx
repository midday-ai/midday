import { getSpending } from "@midday/supabase/cached-queries";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import Link from "next/link";
import { Category } from "../category";
import { spendingData } from "./data";
import { SpendingCategoryItem } from "./spending-category-item";

function SpendingCategoryList({ categories, period }) {
  return (
    <ul className="mt-8 space-y-5 overflow-auto scrollbar-hide h-[360px]">
      {categories.map(({ category, precentage, amount, currency }) => {
        return (
          <li key={category}>
            <HoverCard openDelay={10} closeDelay={10}>
              <HoverCardTrigger asChild>
                <Link
                  className="flex items-center"
                  href={`/transactions?filter=${JSON.stringify({
                    categories: [category],
                    date: { from: period?.from, to: period?.to },
                  })}`}
                >
                  <Category
                    key={category}
                    name={category}
                    className="text-sm text-primary space-x-3 w-[360px]"
                  />

                  <Progress
                    className="w-full rounded-none h-[6px]"
                    value={precentage}
                  />
                </Link>
              </HoverCardTrigger>

              <HoverCardContent className="rounded-xl border shadow-sm bg-background py-2 px-2">
                <SpendingCategoryItem
                  category={category}
                  amount={amount}
                  currency={currency}
                  precentage={precentage}
                />
              </HoverCardContent>
            </HoverCard>
          </li>
        );
      })}
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
    <SpendingCategoryList categories={spending?.data} period={initialPeriod} />
  );
}
