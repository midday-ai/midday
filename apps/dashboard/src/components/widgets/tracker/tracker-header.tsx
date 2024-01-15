"use client";

import { TrackerSelect } from "@/components/tracker-select";
import { useI18n } from "@/locales/client";

export function TrackerHeader() {
  const t = useI18n();

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">165h</span>
      </div>

      <TrackerSelect date={new Date().toDateString()} />
    </div>
  );
}
