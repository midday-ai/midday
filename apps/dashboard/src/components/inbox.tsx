"use client";

import { InboxDetails } from "@/components/inbox-details";
import { InboxList } from "@/components/inbox-list";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useSearchParams } from "next/navigation";

export function Inbox({ mails }) {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const selectedMail = mails.find((mail) => mail.id === selectedId);

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

          <div className="flex items-center relative">
            <Input
              value="inbox.23rwef@midday.ai"
              className="pr-10 text-[#878787]"
            />
            <Icons.Copy className="absolute right-4" />
          </div>
        </div>

        <div className="flex flex-row space-x-8">
          <div>
            <TabsContent value="all" className="m-0">
              <InboxList items={mails} />
            </TabsContent>
            <TabsContent value="completed" className="m-0">
              <InboxList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </div>

          <InboxDetails mail={selectedMail} />
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
