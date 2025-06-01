"use client";

import { Category } from "@/components/category";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import { formatISO } from "date-fns";
import Link from "next/link";
import { SpendingCategoryItem } from "./spending-category-item";

type Props = {
  selectedPeriod: {
    from: string;
    to: string;
  };
  data: RouterOutputs["metrics"]["spending"];
  disabled: boolean;
};

export function SpendingCategoryList({
  data,
  selectedPeriod,
  disabled,
}: Props) {
  return (
    <ul className="mt-8 space-y-4 overflow-auto scrollbar-hide aspect-square pb-14">
      {data?.map((category) => {
        return (
          <li key={category.slug}>
            <HoverCard openDelay={10} closeDelay={10}>
              <HoverCardTrigger asChild>
                <Link
                  className="flex items-center"
                  href={`/transactions?categories=${category.slug}&start=${formatISO(new Date(selectedPeriod.from), { representation: "date" })}&end=${formatISO(new Date(selectedPeriod.to), { representation: "date" })}`}
                >
                  <Category
                    key={category.slug}
                    name={category.name}
                    color={category.color}
                    className="text-sm text-primary space-x-3 w-[90%]"
                  />

                  <Progress
                    className="w-full rounded-none h-[6px]"
                    value={category.percentage}
                  />
                </Link>
              </HoverCardTrigger>

              {!disabled && (
                <HoverCardContent className="border shadow-sm bg-background py-1 px-0">
                  <SpendingCategoryItem
                    color={category.color}
                    amount={category.amount}
                    currency={category.currency}
                    percentage={category.percentage}
                  />
                </HoverCardContent>
              )}
            </HoverCard>
          </li>
        );
      })}
    </ul>
  );
}
