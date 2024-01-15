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
import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "next-usequerystate";
import React from "react";

export function TrackerSheet({ setOpen, isOpen, records }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString.withDefault(
        formatISO(new Date(), { representation: "date" })
      ),
      id: parseAsString,
    },
    {
      shallow: true,
    }
  );

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">
              Project X <span className="text-[#878787]">85h</span>
            </h2>

            <Icons.MoreVertical className="w-5 h-5" />
          </SheetHeader>

          <ScrollArea className="h-full p-0">
            <TrackerSelect
              date={params.date}
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
            <TrackerAddRecord />
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
          setOpen(false);
        }
      }}
    >
      <DrawerContent className="p-6">
        <DrawerHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">
            Project X <span className="text-[#878787]">85h</span>
          </h2>

          <Icons.MoreVertical className="w-5 h-5" />
        </DrawerHeader>

        <TrackerSelect
          date={params.date}
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
        <TrackerAddRecord />
      </DrawerContent>
    </Drawer>
  );
}
