"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { TrackerSelect } from "@/components/tracker-select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRange } from "@midday/supabase/queries";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import React, { useEffect, useState } from "react";
import { TrackerEntriesList } from "../tracker-entries-list";

export function TrackerSheet({ setParams, isOpen, params, project, user }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const [records, setRecords] = useState();

  const { date, projectId } = params;

  async function fetchData() {
    try {
      const { data } = await getTrackerRecordsByRange(supabase, {
        projectId,
        from: formatISO(startOfMonth(new Date(date)), {
          representation: "date",
        }),
        to: formatISO(endOfMonth(new Date(date)), { representation: "date" }),
        teamId: user.team_id,
      });

      setLoading(false);

      if (data) {
        setRecords(data);
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && !records) {
      fetchData();
    }
  }, [date, isOpen]);

  if (isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={() => setParams({ projectId: null, date: null })}
      >
        <SheetContent>
          <SheetHeader className="mb-8 flex justify-between items-center flex-row">
            <h2 className="text-xl">
              {project?.name}{" "}
              <span className="text-[#878787]">
                {secondsToHoursAndMinutes(project?.total_duration)}
              </span>
            </h2>
          </SheetHeader>

          <ScrollArea className="h-full p-0">
            <TrackerSelect
              date={date}
              onSelect={(date) => setParams({ date })}
              className="w-full justify-center mb-8"
            />

            <TrackerMonthGraph
              disableHover
              showCurrentDate
              date={date}
              onSelect={setParams}
              data={records}
              projectId={projectId}
            />

            <TrackerEntriesList
              data={records}
              date={date}
              projectId={projectId}
              defaultAssignedId={user.id}
              isLoading={isLoading}
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
            {project?.name}{" "}
            <span className="text-[#878787]">
              {secondsToHoursAndMinutes(project?.total_duration)}
            </span>
          </h2>
        </DrawerHeader>

        <TrackerSelect
          date={params.date}
          onSelect={(date) => setParams({ date })}
          className="w-full justify-center mb-8"
        />

        {/* <TrackerMonthGraph
          disableHover
          showCurrentDate
          date={params.date}
          onSelect={setParams}
          data={[]}
          projectId={params.id}
        /> */}
        {/* <TrackerAddRecord assignedId={user.id} projectId={data?.id} /> */}
      </DrawerContent>
    </Drawer>
  );
}
