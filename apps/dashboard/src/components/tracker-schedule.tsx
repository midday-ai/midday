"use client";

import { createTrackerEntriesAction } from "@/actions/create-tracker-entries-action";
import { deleteTrackerEntryAction } from "@/actions/delete-tracker-entry";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByDateQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  addMinutes,
  addSeconds,
  differenceInSeconds,
  eachDayOfInterval,
  endOfDay,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerRecordForm } from "./forms/tracker-record-form";
import { TrackerDaySelect } from "./tracker-day-select";

interface TrackerRecord {
  id: string;
  start: Date;
  end: Date;
  project: {
    id: string;
    name: string;
  };
  description?: string;
}

export const NEW_EVENT_ID = "new-event";

const ROW_HEIGHT = 36;
const SLOT_HEIGHT = 9;

type Props = {
  teamId: string;
  userId: string;
  timeFormat: number;
  projectId?: string;
};

export function TrackerSchedule({
  teamId,
  userId,
  timeFormat,
  projectId,
}: Props) {
  const supabase = createClient();

  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedDate, range } = useTrackerParams();
  const [selectedEvent, setSelectedEvent] = useState<TrackerRecord | null>(
    null,
  );
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [data, setData] = useState<TrackerRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [resizingEvent, setResizingEvent] = useState<TrackerRecord | null>(
    null,
  );
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeType, setResizeType] = useState<"top" | "bottom" | null>(null);
  const [movingEvent, setMovingEvent] = useState<TrackerRecord | null>(null);
  const [moveStartY, setMoveStartY] = useState(0);

  const createTrackerEntries = useAction(createTrackerEntriesAction, {
    // onSuccess: (result) => {
    //   if (result.data) {
    //     setSelectedEvent(
    //       result.data.find((event) => event.date === selectedDate) || null,
    //     );
    //   }
    // },
  });

  const deleteTrackerEntry = useAction(deleteTrackerEntryAction, {
    onSuccess: () => {
      console.log("success");
    },
  });

  const sortedRange = range?.sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    const fetchData = async () => {
      const trackerData = await getTrackerRecordsByDateQuery(supabase, {
        teamId,
        userId,
        date: selectedDate,
      });

      if (trackerData?.data) {
        const processedData = trackerData.data.map(
          (event: any): TrackerRecord => {
            const start = event.start
              ? parseISO(event.start)
              : parseISO(`${event.date || selectedDate}T09:00:00`);
            const end = event.end
              ? parseISO(event.end)
              : addSeconds(start, event.duration || 0);

            return {
              ...event,
              id: event.id,
              start,
              end,
              project: {
                id: event.project_id,
                name: event.project?.name || "",
              },
              description: event.description,
            };
          },
        );

        setData(processedData);
        setTotalDuration(trackerData.meta?.totalDuration || 0);
      } else {
        setData([]);
        setTotalDuration(0);
      }
    };

    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate, teamId]);

  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      if (currentHour >= 12) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
        });
      } else {
        scrollRef.current.scrollTo({
          top: ROW_HEIGHT * 6,
        });
      }
    }
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    if (eventId !== NEW_EVENT_ID) {
      deleteTrackerEntry.execute({ id: eventId });
      setData((prevData) => prevData.filter((event) => event.id !== eventId));
      setSelectedEvent(null);
    }
  };

  useHotkeys(
    "backspace",
    () => {
      if (selectedEvent && selectedEvent.id !== NEW_EVENT_ID) {
        handleDeleteEvent(selectedEvent.id);
      }
    },
    [selectedEvent],
  );

  const currentOrNewEvent =
    data.find((event) => event.id === NEW_EVENT_ID) || selectedEvent;

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, timeFormat === 12 ? "hh:mm a" : "HH:mm");
  };

  const handleMouseDown = (slot: number) => {
    if (selectedEvent && selectedEvent.id === NEW_EVENT_ID) {
      setData((prevData) =>
        prevData.filter((event) => event.id !== selectedEvent.id),
      );
    }
    setSelectedEvent(null);
    setIsDragging(true);
    setDragStartSlot(slot);

    const startDate = setMinutes(
      setHours(new Date(), Math.floor(slot / 4)),
      (slot % 4) * 15,
    );

    const endDate = addMinutes(startDate, 15);
    const newEvent: TrackerRecord = {
      id: NEW_EVENT_ID,
      start: startDate,
      end: endDate,
      project: { id: projectId ?? "", name: "" },
    };

    setData((prevData) => [...prevData, newEvent]);
    setSelectedEvent(newEvent);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStartSlot !== null && selectedEvent) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slot = Math.floor(y / SLOT_HEIGHT);
      const start = Math.min(dragStartSlot, slot);
      const end = Math.max(dragStartSlot, slot);
      const startDate = setMinutes(
        setHours(new Date(), Math.floor(start / 4)),
        (start % 4) * 15,
      );
      const endDate = addMinutes(startDate, (end - start + 1) * 15);
      setData((prevData) =>
        prevData.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                start: startDate,
                end: endDate,
              }
            : event,
        ),
      );
      setSelectedEvent((prev) =>
        prev && prev.id === selectedEvent.id
          ? { ...prev, start: startDate, end: endDate }
          : prev,
      );
    } else if (resizingEvent && resizingEvent.id !== NEW_EVENT_ID) {
      const deltaY = e.clientY - resizeStartY;
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);
      if (resizeType === "bottom") {
        const newEnd = addMinutes(resizingEvent.end, deltaSlots * 15);
        setData((prevData) =>
          prevData.map((event) =>
            event.id === resizingEvent.id ? { ...event, end: newEnd } : event,
          ),
        );
        setSelectedEvent((prev) =>
          prev && prev.id === resizingEvent.id
            ? { ...prev, end: newEnd }
            : prev,
        );
      } else if (resizeType === "top") {
        const newStart = addMinutes(resizingEvent.start, deltaSlots * 15);
        setData((prevData) =>
          prevData.map((event) =>
            event.id === resizingEvent.id
              ? { ...event, start: newStart }
              : event,
          ),
        );
        setSelectedEvent((prev) =>
          prev && prev.id === resizingEvent.id
            ? { ...prev, start: newStart }
            : prev,
        );
      }
    } else if (movingEvent) {
      const deltaY = e.clientY - moveStartY;
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);
      const newStart = addMinutes(movingEvent.start, deltaSlots * 15);
      const newEnd = addMinutes(movingEvent.end, deltaSlots * 15);

      // Ensure the event doesn't move before start of day or after end of day
      const dayStart = startOfDay(movingEvent.start);
      const dayEnd = endOfDay(movingEvent.start);

      if (newStart >= dayStart && newEnd <= dayEnd) {
        setData((prevData) =>
          prevData.map((event) =>
            event.id === movingEvent.id
              ? { ...event, start: newStart, end: newEnd }
              : event,
          ),
        );
        setSelectedEvent((prev) =>
          prev && prev.id === movingEvent.id
            ? { ...prev, start: newStart, end: newEnd }
            : prev,
        );
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
    setResizingEvent(null);
    setResizeType(null);
    setMovingEvent(null);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleEventResizeStart = (
    e: React.MouseEvent,
    event: TrackerRecord,
    type: "top" | "bottom",
  ) => {
    if (event.id !== NEW_EVENT_ID) {
      e.stopPropagation();
      setResizingEvent(event);
      setResizeStartY(e.clientY);
      setResizeType(type);
      setSelectedEvent(event);
    }
  };

  const handleEventMoveStart = (e: React.MouseEvent, event: TrackerRecord) => {
    e.stopPropagation();
    // Delete unsaved event if it exists
    setData((prevData) => prevData.filter((e) => e.id !== NEW_EVENT_ID));
    setMovingEvent(event);
    setMoveStartY(e.clientY);
    setSelectedEvent(event);
  };

  const handleEventClick = (event: TrackerRecord) => {
    if (selectedEvent && selectedEvent.id === NEW_EVENT_ID) {
      setData((prevData) => prevData.filter((e) => e.id !== selectedEvent.id));
    }
    setSelectedEvent(event);
  };

  const handleCreateEvent = (values: {
    start: string;
    end: string;
    assigned_id: string;
    project_id: string;
    description?: string;
  }) => {
    const getDates = (): string[] => {
      if (selectedDate) return [selectedDate];
      if (sortedRange && sortedRange.length === 2) {
        const [start, end] = sortedRange;
        if (start && end) {
          return eachDayOfInterval({
            start: parseISO(start),
            end: parseISO(end),
          }).map((date) => format(date, "yyyy-MM-dd"));
        }
      }
      return [];
    };

    const dates = getDates();
    const baseDate =
      dates[0] || selectedDate || format(new Date(), "yyyy-MM-dd");

    const startDate = parseISO(`${baseDate}T${values.start}`);
    const endDate = parseISO(`${baseDate}T${values.end}`);

    const newEvent = {
      start: startDate.toISOString(),
      stop: endDate.toISOString(),
      dates,
      team_id: teamId,
      assigned_id: values.assigned_id,
      project_id: values.project_id,
      description: values.description || "",
      rate: 0,
      currency: "SEK",
      duration: Math.max(0, differenceInSeconds(endDate, startDate)),
    };

    createTrackerEntries.execute(newEvent);
  };

  const getTimeFromDate = (date: Date) => {
    return format(date, "HH:mm");
  };

  const getSlotFromDate = (date: Date) => {
    return date.getHours() * 4 + Math.floor(date.getMinutes() / 15);
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-xl text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </h2>
      </div>

      <TrackerDaySelect />

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-470px)] mt-8">
        <div className="flex text-[#878787] text-xs">
          <div className="w-20 flex-shrink-0 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="pr-4 flex font-mono flex-col"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          <div
            className="relative flex-grow border border-border border-t-0"
            onMouseMove={handleMouseMove}
            onMouseDown={(e) => {
              if (e.button === 0) {
                // Check if left mouse button is pressed
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slot = Math.floor(y / SLOT_HEIGHT);
                handleMouseDown(slot);
              }
            }}
          >
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="absolute w-full border-t border-border user-select-none"
                  style={{ top: `${hour * ROW_HEIGHT}px` }}
                />
              </React.Fragment>
            ))}
            {data?.map((event) => {
              const startSlot = getSlotFromDate(event.start);
              const endSlot = getSlotFromDate(event.end);
              const height = (endSlot - startSlot) * SLOT_HEIGHT;

              return (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger>
                    <div
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "absolute w-full bg-[#F0F0F0]/[0.95] dark:bg-[#1D1D1D]/[0.95] text-[#606060] dark:text-[#878787] border-t border-border",
                        selectedEvent?.id === event.id && "!text-primary",
                        event.id !== NEW_EVENT_ID && "cursor-move",
                      )}
                      style={{
                        top: `${startSlot * SLOT_HEIGHT}px`,
                        height: `${height}px`,
                      }}
                      onMouseDown={(e) =>
                        event.id !== NEW_EVENT_ID &&
                        handleEventMoveStart(e, event)
                      }
                    >
                      <div className="text-xs p-4 flex justify-between items-center select-none pointer-events-none">
                        <span>
                          {event.project.name} (
                          {secondsToHoursAndMinutes(
                            differenceInSeconds(event.end, event.start),
                          )}
                          )
                        </span>
                      </div>
                      {event.id !== NEW_EVENT_ID && (
                        <>
                          <div
                            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
                            onMouseDown={(e) =>
                              handleEventResizeStart(e, event, "top")
                            }
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                            onMouseDown={(e) =>
                              handleEventResizeStart(e, event, "bottom")
                            }
                          />
                        </>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <TrackerRecordForm
        eventId={currentOrNewEvent?.id}
        onCreate={handleCreateEvent}
        isSaving={createTrackerEntries.isExecuting}
        userId={userId}
        teamId={teamId}
        projectId={currentOrNewEvent?.project.id ?? projectId}
        description={currentOrNewEvent?.description}
        start={
          currentOrNewEvent
            ? getTimeFromDate(currentOrNewEvent.start)
            : undefined
        }
        end={
          currentOrNewEvent ? getTimeFromDate(currentOrNewEvent.end) : undefined
        }
        onSelectProject={(project) => {
          if (selectedEvent) {
            setData((prevData) =>
              prevData.map((event) =>
                event.id === selectedEvent.id
                  ? {
                      ...event,
                      project: { id: project.id, name: project.name },
                    }
                  : event,
              ),
            );
          }
        }}
      />
    </div>
  );
}
