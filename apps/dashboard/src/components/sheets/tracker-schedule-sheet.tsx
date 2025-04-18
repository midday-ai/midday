"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TrackerSchedule } from "../tracker-schedule";

export function TrackerScheduleSheet() {
  const { setParams, projectId, range, selectedDate, update, create } =
    useTrackerParams();

  const isOpen =
    !update &&
    !create &&
    (Boolean(projectId) || range?.length === 2 || Boolean(selectedDate));

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() =>
        setParams({ projectId: null, range: null, selectedDate: null })
      }
    >
      <SheetContent>
        <TrackerSchedule />
      </SheetContent>
    </Sheet>
  );
}
