"use client";

import { ScrollArea } from "@midday/ui/scroll-area";
import { cn } from "@midday/ui/utils";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRouter } from "next/navigation";

export function InboxList({ items, selectedId }) {
  const router = useRouter();

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-4 pt-0">
        {items.map((item) => (
          <button
            type="button"
            onClick={() => router.push(`/inbox?id=${item.id}`)}
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-sm transition-all",
              selectedId === item.id &&
                "bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]"
            )}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {item.status === "new" && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#d98d00]" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selectedId === item.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.text.substring(0, 300)}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
