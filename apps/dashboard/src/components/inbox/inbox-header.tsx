"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { InboxOrdering } from "@/components/inbox/inbox-ordering";
import { InboxSearch } from "@/components/inbox/inbox-search";
import { InboxTabs } from "@/components/inbox/inbox-tabs";

export function InboxHeader() {
  return (
    <div className="flex items-center justify-between mb-4 mt-6 w-full pr-[647px]">
      <InboxTabs />

      <div className="flex space-x-2 items-center">
        <InboxSearch />
        <InboxOrdering />

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
