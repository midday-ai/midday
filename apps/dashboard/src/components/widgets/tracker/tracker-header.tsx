"use client";

import { TrackerSelect } from "@/components/tracker-select";

export function TrackerHeader({ date, setDate }) {
  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">165h</span>
      </div>

      <TrackerSelect date={date} onSelect={setDate} />
    </div>
  );
}
