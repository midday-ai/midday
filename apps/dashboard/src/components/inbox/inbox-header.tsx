"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { InboxOrdering } from "@/components/inbox/inbox-ordering";
import { InboxSearch } from "@/components/inbox/inbox-search";
import { InboxTabs } from "@/components/inbox/inbox-tabs";

export function InboxHeader() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 mt-6 w-full pr-0 md:pr-[647px]">
      <InboxTabs />

      <div className="flex flex-1 gap-2 items-center min-w-0">
        <InboxSearch />
        <div className="flex shrink-0 gap-2 items-center">
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
    </div>
  );
}
