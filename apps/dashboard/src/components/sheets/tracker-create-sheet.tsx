"use client";

import { TrackerProjectForm } from "@/components/forms/tracker-project-form";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React from "react";

type Props = {
  defaultCurrency: string;
};

export function TrackerCreateSheet({ defaultCurrency }: Props) {
  const { setParams, create } = useTrackerParams();

  const isOpen = Boolean(create);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams({ create: null })}>
      <SheetContent>
        <SheetHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">Create Project</h2>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-28" hideScrollbar>
          <TrackerProjectForm defaultCurrency={defaultCurrency} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
