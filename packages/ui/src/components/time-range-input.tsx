"use client";

import { differenceInMinutes, parse } from "date-fns";
import { useEffect, useState } from "react";
import { Icons } from "./icons";

export function TimeRangeInput({
  value,
  onChange,
}: {
  value: { start: string | undefined; stop: string | undefined };
  onChange: (value: { start: string; stop: string }) => void;
}) {
  // Ensure we never have undefined values for controlled inputs
  const [startTime, setStartTime] = useState(value.start || "");
  const [stopTime, setStopTime] = useState(value.stop || "");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    setStartTime(value.start || "");
    setStopTime(value.stop || "");
  }, [value]);

  useEffect(() => {
    if (!startTime || !stopTime) {
      return;
    }

    const start = parse(startTime, "HH:mm", new Date());
    let stop = parse(stopTime, "HH:mm", new Date());

    // If stop time is before start time, assume it's on the next day
    if (stop < start) {
      stop = new Date(stop.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
    }

    const diff = differenceInMinutes(stop, start);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    setDuration(`${hours}h ${minutes}min`);
  }, [startTime, stopTime]);

  return (
    <div className="flex items-center w-full border border-border px-4 py-2">
      <div className="flex items-center space-x-2 flex-1">
        <Icons.Time className="w-5 h-5 text-[#878787]" />
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            onChange({ start: e.target.value, stop: stopTime });
          }}
          className="bg-transparent focus:outline-none text-sm"
        />
      </div>
      <div className="flex items-center justify-center flex-shrink-0 mx-4">
        <Icons.ArrowRightAlt className="w-5 h-5 text-[#878787]" />
      </div>
      <div className="flex items-center space-x-2 flex-1 justify-end">
        <input
          type="time"
          value={stopTime}
          onChange={(e) => {
            setStopTime(e.target.value);
            onChange({ start: startTime, stop: e.target.value });
          }}
          className="bg-transparent focus:outline-none text-sm"
        />
        <span className="text-[#878787] text-sm">{duration}</span>
      </div>
    </div>
  );
}
