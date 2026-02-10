"use client";

import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { TrackerProjectForm } from "@/components/forms/tracker-project-form";
import { useTeamQuery } from "@/hooks/use-team";
import { useTrackerParams } from "@/hooks/use-tracker-params";

export function TrackerCreateSheet() {
  const { setParams, create } = useTrackerParams();
  const { data: team } = useTeamQuery();
  const defaultCurrency = team?.baseCurrency || "USD";

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
