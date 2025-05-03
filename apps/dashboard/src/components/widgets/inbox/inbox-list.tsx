"use client";

import { FormatAmount } from "@/components/format-amount";
import { InboxStatus } from "@/components/inbox/inbox-status";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
import Link from "next/link";

type Props = {
  data: RouterOutputs["inbox"]["get"]["data"];
};

export function InboxList({ data }: Props) {
  return (
    <div className="flex flex-col gap-4 overflow-auto scrollbar-hide aspect-square pb-14 mt-8">
      {data?.map((item) => {
        return (
          <Link
            key={item.id}
            href={`/inbox?inboxId=${item.id}`}
            className="flex flex-col items-start gap-2 border p-4 text-left text-sm transition-all"
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">{item?.display_name}</div>
                    {item.transaction_id && <Icons.Check />}
                  </div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {item.date && format(new Date(item.date), "MMM d")}
                </div>
              </div>
              <div className="flex">
                {item?.currency && item?.amount && (
                  <div className="text-xs font-medium">
                    <FormatAmount
                      amount={item.amount}
                      currency={item.currency}
                    />
                  </div>
                )}
                <div className="ml-auto">
                  <InboxStatus item={item} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
