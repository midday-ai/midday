"use client";

import { useEffect, useState } from "react";
import { Icons } from "./icons";

export function TimeRangeInput({
  value,
  onChange,
}: {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
}) {
  const [startTime, setStartTime] = useState(value.start);
  const [endTime, setEndTime] = useState(value.end);
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    setDuration(`${hours}h ${minutes}min`);
  }, [startTime, endTime]);

  return (
    <div className="flex items-center space-x-3 w-full border border-border px-4 py-2 justify-between">
      <div className="flex items-center space-x-2">
        <Icons.Time className="w-5 h-5 text-[#878787]" />

        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            onChange({ ...value, start: e.target.value });
          }}
          className="bg-transparent focus:outline-none text-sm"
        />
      </div>
      <Icons.ArrowRightAlt className="w-5 h-5 text-[#878787]" />
      <div className="flex items-center space-x-2">
        <input
          type="time"
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value);
            onChange({ ...value, end: e.target.value });
          }}
          className="bg-transparent focus:outline-none text-sm"
        />
        <span className="text-[#878787] text-sm">{duration}</span>
      </div>
    </div>
  );
}
