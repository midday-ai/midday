"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByDateQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { format } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { TrackerRecordForm } from "./forms/tracker-record-form";
import { TrackerDaySelect } from "./tracker-day-select";

interface TrackerRecord {
  id: string;
  start: number;
  duration: number;
  project: {
    name: string;
  };
}

const ROW_HEIGHT = 36;
const SLOT_HEIGHT = 9;
const SLOTS_PER_HOUR = 4;

type Props = {
  teamId: string;
  userId: string;
  timeFormat: number;
};

export function TrackerSchedule({ teamId, userId, timeFormat }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedDate } = useTrackerParams();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [data, setData] = useState<TrackerRecord[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [resizingEvent, setResizingEvent] = useState<TrackerRecord | null>(
    null,
  );
  const [resizeStartY, setResizeStartY] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const trackerData = await getTrackerRecordsByDateQuery(supabase, {
        teamId,
        date: selectedDate ?? "",
      });

      setData((trackerData?.data as TrackerRecord[]) ?? []);
      setTotalDuration(trackerData?.meta?.totalDuration ?? 0);
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

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, timeFormat === 12 ? "hh:mm a" : "HH:mm");
  };

  const handleMouseDown = (slot: number) => {
    setIsDragging(true);
    setDragStartSlot(slot);
    setSelectedSlots([slot]);
  };

  const handleMouseEnter = (slot: number) => {
    if (isDragging && dragStartSlot !== null) {
      const start = Math.min(dragStartSlot, slot);
      const end = Math.max(dragStartSlot, slot);
      const newSelectedSlots = [];
      for (let i = start; i <= end; i++) {
        newSelectedSlots.push(i);
      }
      setSelectedSlots(newSelectedSlots);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
    setResizingEvent(null);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleEventResizeStart = (
    e: React.MouseEvent,
    event: TrackerRecord,
  ) => {
    setResizingEvent(event);
    setResizeStartY(e.clientY);
  };

  const handleEventResize = (e: React.MouseEvent) => {
    if (resizingEvent && scrollRef.current) {
      const deltaY = e.clientY - resizeStartY;
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);
      const newDuration =
        Math.max(
          1,
          Math.ceil(resizingEvent.duration / (15 * 60)) + deltaSlots,
        ) *
        15 *
        60;

      setData((prevData) =>
        prevData.map((item) =>
          item.id === resizingEvent.id
            ? { ...item, duration: newDuration }
            : item,
        ),
      );
    }
  };

  const handleEventResizeEnd = () => {
    setResizingEvent(null);
    // Here you would typically update the backend with the new event duration
  };

  const handleEditEvent = (event: TrackerRecord) => {
    // Implement edit event logic
  };

  const getTimeFromSlot = (slot: number) => {
    const hour = Math.floor(slot / 4);
    const minute = (slot % 4) * 15;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const selectedStart =
    selectedSlots.length > 0
      ? getTimeFromSlot(Math.min(...selectedSlots))
      : undefined;
  const selectedEnd =
    selectedSlots.length > 0
      ? getTimeFromSlot(Math.max(...selectedSlots) + 1)
      : undefined;

  return (
    <div className="w-full">
      <div className="space-y-2 text-center sm:text-left mb-8 flex justify-between items-center flex-row">
        <h2 className="text-xl text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </h2>

        <Button variant="outline" size="icon">
          <Icons.Tune size={16} />
        </Button>
      </div>
      <TrackerDaySelect />

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-485px)] mt-8">
        <div className="flex text-[#878787] text-xs">
          <div className="w-20 flex-shrink-0">
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
            onMouseMove={handleEventResize}
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
              const startSlot = event.start ?? 9 * SLOTS_PER_HOUR; // Set to 09:00 if null
              const endSlot = startSlot + Math.ceil(event.duration / (15 * 60));
              const height = (endSlot - startSlot) * SLOT_HEIGHT;

              return (
                <div
                  key={event.id}
                  className="absolute w-full cursor-move z-10 bg-[#1D1D1D]"
                  style={{
                    top: `${startSlot * SLOT_HEIGHT}px`,
                    height: `${height}px`,
                  }}
                >
                  <div className="text-xs text-white p-4 flex justify-between items-center">
                    <span>
                      {event.project.name} (
                      {secondsToHoursAndMinutes(event.duration)})
                    </span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                    onMouseDown={(e) => handleEventResizeStart(e, event)}
                    onMouseUp={handleEventResizeEnd}
                  />
                </div>
              );
            })}
            {hours.map((hour) =>
              [0, 1, 2, 3].map((quarter) => {
                const slot = hour * 4 + quarter;
                return (
                  <div
                    key={slot}
                    className={cn(
                      "absolute w-full cursor-pointer",
                      selectedSlots.includes(slot)
                        ? "h-[9px] bg-[#1D1D1D]/[0.9]"
                        : "h-9",
                    )}
                    style={{
                      top: `${slot * SLOT_HEIGHT}px`,
                    }}
                    onMouseDown={() => handleMouseDown(slot)}
                    onMouseEnter={() => handleMouseEnter(slot)}
                  />
                );
              }),
            )}
          </div>
        </div>
      </ScrollArea>

      <TrackerRecordForm
        onCreate={() => {}}
        userId={userId}
        teamId={teamId}
        projectId="4210f672-b50d-4a7d-a345-4cca12110ce9"
        start={selectedStart}
        end={selectedEnd}
      />
    </div>
  );
}
