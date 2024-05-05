import {
  getBankAccountsCurrencies,
  getSpending,
} from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { spendingData } from "./data";
import { SpendingCategoryList } from "./spending-category-list";
import { cookies } from "next/headers";
import { Cookies } from "@/utils/constants";

export function SpendingListSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      {[...Array(16)].map((_, index) => (
        <div key={index.toString()} className="flex justify-between px-3">
          <div className="w-[70%]">
            <Skeleton className="h-2.5 w-[70%]" />
          </div>
          <div className="w-full ml-auto">
            <Skeleton className="w-full align-start h-[6px] rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function SpendingList({ initialPeriod, disabled }) {
  const currency = cookies().has(Cookies.ChartCurrency)
    ? cookies().get(Cookies.ChartCurrency)?.value
    : (await getBankAccountsCurrencies())?.data?.at(0)?.currency || "USD";

  const spending = disabled
    ? spendingData
    : await getSpending({ ...initialPeriod, currency });

  if (!spending?.data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060]">No transactions found</p>
      </div>
    );
  }

  return (
    <SpendingCategoryList categories={spending?.data} period={initialPeriod} />
  );
}
