"use client";

import { TrackerAddRecord } from "@/components/tracker-add-record";
import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { TrackerRecords } from "@/components/tracker-records";
import { TrackerSelect } from "@/components/tracker-select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { intervalToDuration } from "date-fns";
import React from "react";

export function TrackerSheet({
  setParams,
  isOpen,
  records,
  params,
  data,
  user,
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const duration = intervalToDuration({
    start: 0,
    end: data?.total_duration * 1000,
  });

  if (isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={() => setParams({ projectId: null, date: null })}
      >
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">
              {data?.name}{" "}
              <span className="text-[#878787]">{duration.hours ?? 0}h</span>
            </h2>
          </SheetHeader>

          <ScrollArea className="h-full p-0">
            <TrackerSelect
              date={params.date}
              onSelect={(date) => setParams({ date })}
              className="w-full justify-center mb-8"
            />

            <TrackerMonthGraph
              disableHover
              showCurrentDate
              date={params.date}
              onSelect={setParams}
              records={records}
              currentProjectId={params.id}
            />

            <TrackerRecords
              data={records[params.date]}
              date={params.date}
              projectId={data?.id}
            />
            <TrackerAddRecord
              assignedId={user.id}
              projectId={data?.id}
              date={params.date}
              key={params.date}
              teamId={user.team_id}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setParams({ projectId: null, date: null });
        }
      }}
    >
      <DrawerContent className="p-6">
        <DrawerHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">
            {data?.name}{" "}
            <span className="text-[#878787]">{duration.hours ?? 0}h</span>
          </h2>
        </DrawerHeader>

        <TrackerSelect
          date={params.date}
          onSelect={(date) => setParams({ date })}
          className="w-full justify-center mb-8"
        />

        <TrackerMonthGraph
          disableHover
          showCurrentDate
          date={params.date}
          onSelect={setParams}
          records={records}
          currentProjectId={params.id}
        />
        <TrackerRecords data={records[params.date]} date={params.date} />
        <TrackerAddRecord assignedId={user.id} projectId={data?.id} />
      </DrawerContent>
    </Drawer>
  );
}
