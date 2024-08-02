import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { InboxItem } from "./inbox-item";

type InboxListProps = {
  items: {
    id: string;
    status: "done" | "processing" | "new";
    display_name: string;
    created_at: string;
    file_name?: string;
    date?: string;
    currency?: string;
    amount?: number;
  }[];
  hasQuery?: boolean;
  onClear?: () => void;
};

export function InboxList({ items, hasQuery, onClear }: InboxListProps) {
  if (hasQuery && !items?.length) {
    return (
      <div className="h-screen -mt-[140px] w-full flex items-center justify-center flex-col">
        <div className="flex flex-col items-center">
          <Icons.Transactions2 className="mb-4" />
          <div className="text-center mb-6 space-y-2">
            <h2 className="font-medium text-lg">No results</h2>
            <p className="text-[#606060] text-sm">Try another search term</p>
          </div>

          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        </div>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="h-screen -mt-[140px] w-full flex items-center justify-center flex-col">
        <Icons.InboxEmpty size={32} />
        <span className="font-medium mb-2 mt-4">Inbox empty</span>
        <span className="text-sm text-[#878787]">
          You can relax, nothing in here.
        </span>
      </div>
    );
  }

  // Only run when first item has status=new or deleted
  const initialAnimation = items?.at(0)?.status === "new" && {
    opacity: 0,
    height: 0,
  };

  const exitAnimation = !hasQuery && {
    opacity: 0,
    height: 0,
  };

  return (
    <ScrollArea className="h-screen" hideScrollbar>
      <div className="flex flex-col gap-4 pb-[250px]">
        <AnimatePresence initial={false}>
          {items?.map((item) => {
            return (
              <motion.div
                key={item.id}
                initial={initialAnimation}
                animate={{ opacity: 1, height: "auto" }}
                exit={exitAnimation}
                transition={{
                  opacity: { duration: 0.2 },
                  height: { type: "spring", bounce: 0.3, duration: 0.5 },
                }}
                className="w-full"
              >
                <InboxItem key={item.id} item={item} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
