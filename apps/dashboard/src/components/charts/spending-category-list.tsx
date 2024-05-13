"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Progress } from "@midday/ui/progress";
import { useMeasure } from "@uidotdev/usehooks";
import Link from "next/link";
import { Category } from "../category";
import { SpendingCategoryItem } from "./spending-category-item";

const PADDING = 60;

export function SpendingCategoryList({ categories, period }) {
  const [ref, { width }] = useMeasure();

  return (
    <div ref={ref}>
      <ul
        className="mt-8 space-y-5 overflow-auto scrollbar-hide"
        style={{ maxHeight: width - PADDING }}
      >
        {categories.map(
          ({ category, name, color, percentage, amount, currency }) => {
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

                  <HoverCardContent className="rounded-xl border shadow-sm bg-background py-2 px-2">
                    <SpendingCategoryItem
                      color={color}
                      name={name}
                      amount={amount}
                      currency={currency}
                      percentage={percentage}
                    />
                  </HoverCardContent>
                </HoverCard>
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
}
