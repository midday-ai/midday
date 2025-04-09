"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TrackerSchedule } from "../tracker-schedule";

type Props = {
  defaultCurrency: string;
};

export function TrackerScheduleSheet({ defaultCurrency }: Props) {
  const { setParams, projectId, range, selectedDate, update, create } =
    useTrackerParams();

  const isOpen =
    !update &&
    !create &&
    (Boolean(projectId) || range?.length === 2 || Boolean(selectedDate));

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent>
        <TrackerSchedule defaultCurrency={defaultCurrency} />
      </SheetContent>
    </Sheet>
  );
}
