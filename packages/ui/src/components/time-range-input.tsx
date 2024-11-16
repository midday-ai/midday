"use client";

import { differenceInMinutes, parse } from "date-fns";
import { useMemo } from "react";
import { Icons } from "./icons";

export function TimeRangeInput({
  value,
  onChange,
}: {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
}) {
  const startTime = value.start;
  const endTime = value.end;

  const duration = useMemo(() => {
    if (!startTime || !endTime) {
      return "";
    }

    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());
    const diff = differenceInMinutes(end, start);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}min`;
  }, [startTime, endTime]);

  return (
    <div className="flex items-center w-full border border-border px-4 py-2">
      <div className="flex items-center space-x-2 flex-1">
        <Icons.Time className="w-5 h-5 text-[#878787]" />
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            onChange({ ...value, start: e.target.value });
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
          value={endTime}
          onChange={(e) => {
            onChange({ ...value, end: e.target.value });
          }}
          className="bg-transparent focus:outline-none text-sm"
        />
        <span className="text-[#878787] text-sm">{duration}</span>
      </div>
    </div>
  );
}
