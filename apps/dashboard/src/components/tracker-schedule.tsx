"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByDateQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { format } from "date-fns";
import MotionNumber from "motion-number";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { TrackerRecordForm } from "./forms/tracker-record-form";
import { TrackerDaySelect } from "./tracker-day-select";

type Event = {
  name: string;
  start: number;
  duration: number;
};

type TrackerRecord = {};

const events: Event[] = [
  { name: "Migo", start: 9, duration: 6 },
  { name: "Playfair", start: 16, duration: 3 },
];

const ROW_HEIGHT = 36;

export function TrackerSchedule() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedDate } = useTrackerParams();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [data, setData] = useState<TrackerRecord[]>([]);

  console.log(data);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const trackerData = await getTrackerRecordsByDateQuery(supabase, {
        teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        date: selectedDate,
      });

      setData(trackerData);
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

  const getEventStyle = (event: Event) => {
    const top = `${event.start * ROW_HEIGHT}px`;
    const height = `${event.duration * ROW_HEIGHT}px`;
    return { top, height };
  };

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, is24HourFormat ? "HH:mm" : "hh:mm a");
  };

  const toggleTimeFormat = () => {
    setIs24HourFormat(!is24HourFormat);
  };

  return (
    <div className="w-full">
      <div className="space-y-2 text-center sm:text-left mb-8 flex justify-between items-center flex-row">
        <h2 className="text-xl text-[#878787]">
          <MotionNumber
            value={
              data.meta?.totalDuration ? data.meta.totalDuration / 3600 : 0
            }
          />
          h
        </h2>

        <Button variant="outline" size="icon">
          <Icons.Tune size={16} />
        </Button>
      </div>
      <TrackerDaySelect />
      {/* <button onClick={toggleTimeFormat} className="mb-2" type="button">
        Toggle {is24HourFormat ? "12-hour" : "24-hour"} format
      </button> */}

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-440px)] mt-8">
        <div className="flex text-[#878787] text-xs">
          <div className="w-20 flex-shrink-0">
            {hours.map((hour) => (
              <div key={hour} className="h-9 pr-4 flex font-mono flex-col">
                {formatHour(hour)}
              </div>
            ))}
          </div>
          <div className="relative flex-grow border border-border">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute w-full h-9"
                style={{ top: `${hour * ROW_HEIGHT}px` }}
              >
                {index !== 0 && <div className="border-t border-border" />}
              </div>
            ))}
            {events.map((event, index) => (
              <div
                key={index.toString()}
                className="absolute left-0 right-0 bg-[#1D1D1D]/[0.92] border-t border-border px-4 py-2"
                style={getEventStyle(event)}
              >
                <div className="text-white">
                  {event.name} ({event.duration}h)
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <TrackerRecordForm onCreate={() => {}} projectId="1" userId="1" />
    </div>
  );
}
