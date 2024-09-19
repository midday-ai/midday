"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import { formatISO } from "date-fns";
import Link from "next/link";
import { Category } from "../category";
import { SpendingCategoryItem } from "./spending-category-item";

type Props = {
  categories: any;
  period: any;
  disabled: boolean;
};

export function SpendingCategoryList({ categories, period, disabled }: Props) {
  return (
    <ul className="mt-8 space-y-4 overflow-auto scrollbar-hide aspect-square pb-14">
      {categories.map(({ slug, name, color, percentage, amount, currency }) => {
        return (
          <li key={slug}>
            <HoverCard openDelay={10} closeDelay={10}>
              <HoverCardTrigger asChild>
                <Link
                  className="flex items-center"
                  href={`/transactions?categories=${slug}&start=${formatISO(period?.from, { representation: "date" })}&end=${formatISO(period?.to, { representation: "date" })}`}
                >
                  <Category
                    key={slug}
                    name={name}
                    color={color}
                    className="text-sm text-primary space-x-3 w-[90%]"
                  />

                  <Progress
                    className="w-full rounded-none h-[6px]"
                    value={percentage}
                  />
                </Link>
              </HoverCardTrigger>

              {!disabled && (
                <HoverCardContent className="border shadow-sm bg-background py-1 px-0">
                  <SpendingCategoryItem
                    color={color}
                    name={name}
                    amount={amount}
                    currency={currency}
                    percentage={percentage}
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
