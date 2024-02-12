"use client";

import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { TrackerSelect } from "@/components/tracker-select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRange } from "@midday/supabase/queries";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";
import { TrackerEntriesList } from "../tracker-entries-list";

export function TrackerSheet({ setParams, isOpen, params, project, user }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const [records, setData] = useState();
  const [totalDuration, setTotalDuration] = useState(0);
  const { toast } = useToast();

  const { execute } = useAction(updateEntriesAction, {
    onError: () => {
      // TODO: Delete latest entry
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: async (params) => {
      await fetchData({
        date: params.date,
        projectId: params.project_id,
      });
    },
  });

  const updateEntries = ({ action, ...payload }) => {
    switch (action) {
      case "create": {
        const data = (records && records[date]) ?? [];
        const items = [...data, payload];

        setData((prev) => ({ ...prev, [date]: items }));
        break;
      }
      case "delete": {
        const items =
          records && records[date]?.filter((item) => item.id !== payload.id);
        setData((prev) => ({ ...prev, [date]: items }));
        break;
      }
      default:
        return records;
    }
  };

  const handleOnDelete = (id: string) => {
    const paylaod = { action: "delete", id };
    execute(paylaod);
    updateEntries(paylaod);
  };

  const handleOnCreate = async (params) => {
    const payload = {
      action: "create",
      project_id: projectId,
      assigned: user,
      date,
      ...params,
    };

    execute(payload);
    updateEntries({ ...payload, id: -Math.random() });
  };

  async function fetchData({ date, projectId }) {
    try {
      const { data, meta } = await getTrackerRecordsByRange(supabase, {
        projectId,
        from: formatISO(startOfMonth(new Date(date)), {
          representation: "date",
        }),
        to: formatISO(endOfMonth(new Date(date)), {
          representation: "date",
        }),
        teamId: user.team_id,
      });

      setLoading(false);

      setTotalDuration(meta.totalDuration);

      if (data) {
        setData(data);
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData(params);
    }
    // TODO: Only fetch when month change
  }, [params, isOpen]);

  const { date, projectId } = params;

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
                {secondsToHoursAndMinutes(totalDuration)}
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
              data={(records && records[date]) ?? []}
              date={date}
              user={user}
              onCreate={handleOnCreate}
              onDelete={handleOnDelete}
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

        <TrackerMonthGraph
          disableHover
          showCurrentDate
          date={date}
          onSelect={setParams}
          data={records}
          projectId={projectId}
        />

        <TrackerEntriesList
          data={(records && records[date]) ?? []}
          date={date}
          user={user}
          onCreate={handleOnCreate}
          onDelete={handleOnDelete}
        />
      </DrawerContent>
    </Drawer>
  );
}
