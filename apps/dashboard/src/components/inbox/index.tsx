"use client";

import { type TAB_ITEMS, useInboxParams } from "@/hooks/use-inbox-params";
import { Tabs } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ReactNode } from "react";
import { InboxHeader } from "./inbox-header";
import { UploadZone } from "./inbox-upload-zone";

type Props = {
  children: ReactNode;
};

export function Inbox({ children }: Props) {
  const { params, setParams } = useInboxParams();

  return (
    <UploadZone>
      <TooltipProvider delayDuration={0}>
        <Tabs
          value={params.tab}
          onValueChange={(value) => {
            setParams({ tab: value as (typeof TAB_ITEMS)[number] });
          }}
        >
          <InboxHeader />
          {children}
        </Tabs>
      </TooltipProvider>
    </UploadZone>
  );
}
