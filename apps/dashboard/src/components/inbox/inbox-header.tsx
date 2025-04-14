"use client";

import { InboxOrdering } from "@/components/inbox/inbox-ordering";
import { InboxSearch } from "@/components/inbox/inbox-search";
import { InboxSettingsModal } from "@/components/inbox/modals/inbox-settings-modal";
import { TAB_ITEMS } from "@/hooks/use-inbox-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { TabsList, TabsTrigger } from "@midday/ui/tabs";

export function InboxHeader() {
  return (
    <div className="flex justify-center items-center space-x-4 mb-4 mt-4 w-full pr-[732px]">
      <TabsList>
        {TAB_ITEMS.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>

      <InboxSearch />

      <div className="flex space-x-2">
        <InboxOrdering />
        {/* <InboxSettingsModal
          forwardEmail={forwardEmail}
          inboxId={inboxId}
          inboxForwarding={inboxForwarding}
        /> */}

        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById("upload-files")?.click()}
        >
          <Icons.Add size={17} />
        </Button>
      </div>
    </div>
  );
}
