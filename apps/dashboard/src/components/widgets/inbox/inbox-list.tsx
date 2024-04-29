"use client";

import { FormatAmount } from "@/components/format-amount";
import { InboxStatus } from "@/components/inbox-status";
import { Icons } from "@midday/ui/icons";
import { useMeasure } from "@uidotdev/usehooks";
import { format } from "date-fns";
import Link from "next/link";

const PADDING = 35;

export function InboxList({ data }) {
  const [ref, { width }] = useMeasure();

  return (
    <div ref={ref}>
      <div
        className="flex flex-col gap-4 pt-8 overflow-auto scrollbar-hide"
        style={{ maxHeight: width - PADDING }}
      >
        {data.map((item) => {
          const tab = item.transaction_id ? "done" : "todo";

          return (
            <Link
              key={item.id}
              href={`/inbox?id=${item.id}&tab=${tab}`}
              className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-sm transition-all"
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold">{item?.display_name}</div>
                      {item.status === "handled" && <Icons.Check />}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {item.due_date && format(new Date(item.due_date), "PP")}
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
    </div>
  );
}
