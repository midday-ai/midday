"use client";

import { InboxDetails } from "@/components/inbox-details";
import { InboxList } from "@/components/inbox-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useSearchParams } from "next/navigation";
import { CopyInput } from "./copy-input";

export function InboxView({ items }) {
  const searchParams = useSearchParams();
  const selectedId = searchParams.has("id")
    ? searchParams.get("id")
    : items.at(0).id;

  const selectedItems = items.find((item) => item.id === selectedId);

  return (
    <TooltipProvider delayDuration={0}>
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between py-2 mb-4 mt-2">
          <TabsList className="p-0 h-auto space-x-4 bg-transparent">
            <TabsTrigger className="p-0" value="all">
              All
            </TabsTrigger>
            <TabsTrigger className="p-0" value="completed">
              Completed
            </TabsTrigger>
          </TabsList>

          <CopyInput value="inbox.23rwef@midday.ai" />
        </div>

        <div className="flex flex-row space-x-8">
          <div className="w-full">
            <TabsContent value="all" className="m-0">
              <InboxList items={items} selectedId={selectedId} />
            </TabsContent>
            <TabsContent value="completed" className="m-0">
              <InboxList
                items={items.filter((item) => item.status === "completed")}
                selectedId={selectedId}
              />
            </TabsContent>
          </div>

          <InboxDetails mail={selectedItems} />
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
