"use client";

import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { cn } from "@midday/ui/utils";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

export function InboxList({ items, selectedId, updateInbox, setSelectedId }) {
  if (!items.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        No results.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-4 pt-0">
        {items.map((item) => (
          <button
            type="button"
            onClick={() => {
              setSelectedId(item.id);

              if (!item.read) {
                updateInbox({ id: item.id, read: true });
              }
            }}
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
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">{item.name}</div>
                    {item.status === "completed" && <Icons.Check />}
                  </div>
                  {!item.read && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#FFD02B]" />
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
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item?.file_name}</div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
