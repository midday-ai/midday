"use client";

import { secondsToHoursAndMinutes } from "@/utils/format";

export function TrackerEvents({ data }) {
  return (
    <div className="flex flex-col space-y-2 font-sans w-full">
      {data?.map((event) => (
        <button
          type="button"
          className="text-xs bg-[#1D1D1D] block p-1 w-full text-left"
          key={event.id}
        >
          {event.project.name} ({secondsToHoursAndMinutes(event.duration)})
        </button>
      ))}
    </div>
  );
}
