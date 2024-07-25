"use client";

import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { TrackerSelect } from "@/components/tracker-select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRangeQuery } from "@midday/supabase/queries";
import { Drawer, DrawerContent, DrawerHeader } from "@midday/ui/drawer";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { endOfMonth, formatISO, isSameMonth, startOfMonth } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";
import { TrackerEntriesList } from "../tracker-entries-list";
import { TrackerSelectProject } from "../tracker-select-project";

export function TrackerSheet({ setParams, isOpen, params, project, user }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const supabase = createClient();
  const [isLoading, setLoading] = useState(true);
  const [records, setData] = useState();
  const [meta, setMeta] = useState();
  const { toast } = useToast();

  const { day, projectId } = params;

  const { execute } = useAction(updateEntriesAction, {
    onError: () => {
      // TODO: Delete latest entry
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: async ({ data }) => {
      await fetchData({
        day: data.date,
        projectId: data.project_id,
      });
    },
  });

  const updateEntries = ({ action, ...payload }) => {
    switch (action) {
      case "create": {
        const data = (records && records[day]) ?? [];
        const items = [...data, payload];

        setData((prev) => ({ ...prev, [day]: items }));
        break;
      }
      case "delete": {
        const items =
          records && records[day]?.filter((item) => item.id !== payload.id);
        setData((prev) => ({ ...prev, [day]: items }));
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
      date: day,
      ...params,
    };

    execute(payload);
    updateEntries({ ...payload, id: -Math.random() });
  };

  async function fetchData({ day, projectId }) {
    if (!user?.team_id) {
      return null;
    }

    try {
      const { data, meta } = await getTrackerRecordsByRangeQuery(supabase, {
        projectId,
        from: formatISO(startOfMonth(new Date(day)), {
          representation: "date",
        }),
        to: formatISO(endOfMonth(new Date(day)), {
          representation: "date",
        }),
        teamId: user.team_id,
      });

      setLoading(false);
      setMeta(meta);

      if (data) {
        setData(data);
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    // NOTE Fetch when new month
    if (
      meta &&
      !isSameMonth(new Date(meta.from), new Date(params.day)) &&
      params.projectId !== "new"
    ) {
      fetchData(params);
    }
  }, [meta, params]);

  useEffect(() => {
    if (isOpen && params.projectId !== "new" && !records) {
      fetchData(params);
    }

    if (params.projectId === "new") {
      setLoading(false);
    }
  }, [params, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setData();
    }
  }, [isOpen]);

  if (isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={() => setParams({ projectId: null, day: null })}
      >
        <SheetContent>
          {params.projectId !== "new" && (
            <SheetHeader className="mb-8 flex justify-between items-center flex-row">
              <h2 className="text-xl">
                {project?.name}{" "}
                <span className="text-[#878787]">
                  {secondsToHoursAndMinutes(meta?.totalDuration)}
                </span>
              </h2>
            </SheetHeader>
          )}

          {params.projectId === "new" && (
            <div className="mb-6">
              <TrackerSelectProject
                setParams={setParams}
                teamId={user.team_id}
              />
            </div>
          )}

          <ScrollArea className="h-full p-0" hideScrollbar>
            <TrackerSelect
              date={day}
              onSelect={(day) => setParams({ day })}
              className="w-full justify-center mb-8"
            />

            <TrackerMonthGraph
              disableHover
              showCurrentDate
              date={day}
              onSelect={setParams}
              data={records}
              projectId={projectId}
              weekStartsOn={user.week_starts_on_monday && 1}
            />

            <TrackerEntriesList
              data={(records && records[day]) ?? []}
              date={day}
              user={user}
              onCreate={handleOnCreate}
              onDelete={handleOnDelete}
              isLoading={isLoading}
              projectId={projectId}
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
          setParams({ projectId: null, day: null });
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
          date={params.day}
          onSelect={(day) => setParams({ day })}
          className="w-full justify-center mb-8"
        />

        <TrackerMonthGraph
          disableHover
          showCurrentDate
          date={day}
          onSelect={setParams}
          data={records}
          projectId={projectId}
          weekStartsOn={user.week_starts_on_monday && 1}
        />

        <TrackerEntriesList
          data={(records && records[day]) ?? []}
          date={day}
          user={user}
          onCreate={handleOnCreate}
          onDelete={handleOnDelete}
          projectId={projectId}
        />
      </DrawerContent>
    </Drawer>
  );
}
