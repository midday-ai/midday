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
  meta?: {
    totalDuration?: number;
  };
}

const ROW_HEIGHT = 36;

export function TrackerSchedule() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedDate } = useTrackerParams();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [data, setData] = useState<TrackerRecord[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const trackerData = await getTrackerRecordsByDateQuery(supabase, {
        teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        date: selectedDate ?? "",
      });

      setData(trackerData?.data ?? []);
      setTotalDuration(trackerData?.data?.meta?.totalDuration ?? 0);
    };

    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate]);

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
    return format(date, is24HourFormat ? "HH:mm" : "hh:mm a");
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
    const totalSeconds = selectedSlots.length * 15 * 60; // Each slot represents 15 minutes (900 seconds)
    setTotalDuration((prev) => prev + totalSeconds);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [selectedSlots]);

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

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-200px)] mt-8">
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
          <div className="relative flex-grow border border-border border-t-0">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="absolute w-full border-t border-border"
                  style={{ top: `${hour * ROW_HEIGHT}px` }}
                />
                {[0, 1, 2, 3].map((quarter) => {
                  const slot = hour * 4 + quarter;

                  return (
                    <div
                      key={slot}
                      className={cn(
                        "absolute w-full cursor-pointer z-5",
                        selectedSlots.includes(slot)
                          ? "h-[9px] bg-[#1D1D1D]/[0.9]"
                          : "h-9",
                      )}
                      style={{
                        top: `${slot * 9}px`,
                      }}
                      onMouseDown={() => handleMouseDown(slot)}
                      onMouseEnter={() => handleMouseEnter(slot)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* <TrackerRecordForm onCreate={() => {}} projectId="1" userId="1" /> */}
    </div>
  );
}
