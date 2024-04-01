"use client";
import { InboxStatus } from "@/components/inbox-status";
import { Icons } from "@midday/ui/icons";
import { useMeasure } from "@uidotdev/usehooks";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import Link from "next/link";

const PADDING = 35;

export function InboxList({ data }) {
  const [ref, { width }] = useMeasure();

  return (
    <div ref={ref}>
      <div
        className="flex flex-col gap-4 pt-8 overflow-auto"
        style={{ maxHeight: width - PADDING }}
      >
        {data.map((item) => (
          <Link
            key={item.id}
            href={`/inbox?id=${item.id}`}
            className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-sm transition-all"
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">{item.name}</div>
                    {item.status === "handled" && <Icons.Check />}
                  </div>
                  {!item.read && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#FFD02B]" />
                  )}
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="flex">
                <div className="text-xs font-medium">{item?.file_name}</div>
                <div className="ml-auto">
                  <InboxStatus item={item} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
