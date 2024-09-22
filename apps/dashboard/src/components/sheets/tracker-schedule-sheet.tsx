"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TrackerSchedule } from "../tracker-schedule";

type Props = {
  teamId: string;
  userId: string;
};

export function TrackerScheduleSheet({ teamId, userId }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { setParams, projectId, range, selectedDate } = useTrackerParams();

  const isOpen = Boolean(projectId || range?.length === 2 || selectedDate);

  if (isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={() =>
          setParams({ projectId: null, range: null, selectedDate: null })
        }
      >
        <SheetContent>
          <TrackerSchedule teamId={teamId} userId={userId} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setParams({ projectId: null, range: null, selectedDate: null });
        }
      }}
    >
      <DrawerContent>
        <TrackerSchedule teamId={teamId} userId={userId} />
      </DrawerContent>
    </Drawer>
  );
}
