import { getExpensesByMerchant } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { MerchantSpendingCategoryList } from "./merchant-spending-category-list";

export function MerchantSpendingListSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {[...Array(16)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center"
        >
          <div className="w-[70%] flex space-x-4 pr-8 items-center">
            <Skeleton className="rounded-[2px] size-[12px]" />
            <Skeleton className="h-[6px] w-full rounded-none" />
          </div>
          <div className="w-full ml-auto">
            <Skeleton className="w-full align-start h-[6px] rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  initialPeriod: any;
  disabled: boolean;
  currency?: string;
};

export async function MerchantSpendingList({
  initialPeriod,
  disabled,
  currency,
}: Props) {
  // TODO: handle disabled
  const spending = await getExpensesByMerchant({ ...initialPeriod, currency });

  if (!spending?.data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060]">
          No transactions have been categorized in this period.
        </p>
      </div>
    );
  }

  return (
    <MerchantSpendingCategoryList
      data={spending?.data}
      period={initialPeriod}
      disabled={disabled}
      currency={currency}
    />
  );
}
