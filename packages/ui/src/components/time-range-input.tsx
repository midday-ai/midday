"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

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
    <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg flex items-center space-x-3 w-fit">
      <div className="flex items-center space-x-2">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            onChange({ ...value, start: e.target.value });
          }}
          className="bg-transparent text-lg font-semibold focus:outline-none"
        />
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
      <input
        type="time"
        value={endTime}
        onChange={(e) => {
          setEndTime(e.target.value);
          onChange({ ...value, end: e.target.value });
        }}
        className="bg-transparent text-lg font-semibold focus:outline-none"
      />
      <span className="text-gray-400 text-sm">{duration}</span>
    </div>
  );
}
