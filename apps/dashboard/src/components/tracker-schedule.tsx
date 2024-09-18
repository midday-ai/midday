"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import React from "react";
import { TrackerRecordForm } from "./forms/tracker-record-form";
import { TrackerMonthSelect } from "./tracker-month-select";

type Event = {
  name: string;
  start: number;
  duration: number;
};

const events: Event[] = [
  { name: "Migo", start: 9, duration: 6 },
  { name: "Playfair", start: 16, duration: 3 },
];

export function TrackerSchedule() {
  const { date, setParams } = useTrackerParams();
  const hours = Array.from({ length: 17 }, (_, i) => i + 8);

  const getEventStyle = (event: Event) => {
    const top = `${(event.start - 8) * 36}px`;
    const height = `${event.duration * 36}px`;
    return { top, height };
  };

  return (
    <div className="w-full">
      <TrackerMonthSelect
        date={date}
        dateFormat="MMMM"
        onSelect={(date) => setParams({ date })}
      />

      <div className="flex text-[#878787] text-xs mt-8">
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-9 pr-4 flex items-center flex-col justify-center font-mono"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative flex-grow border border-border">
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="absolute w-full h-9"
              style={{ top: `${(hour - 8) * 36}px` }}
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

      <TrackerRecordForm
        userId="330e6a53-7a98-407c-a135-26882a2bcaf3"
        onCreate={() => {}}
        projectId="1"
      />
    </div>
  );
}
