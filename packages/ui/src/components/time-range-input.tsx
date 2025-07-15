"use client";

import { differenceInMinutes, format, parse } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Icons } from "./icons";

// Custom time input component that respects timeFormat
function TimeInput({
  value,
  onChange,
  timeFormat = 24,
}: {
  value: string;
  onChange: (value: string) => void;
  timeFormat?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const date = parse(timeStr, "HH:mm", new Date());
      return format(date, timeFormat === 12 ? "hh:mm a" : "HH:mm");
    } catch {
      return "";
    }
  };

  // Parse display time back to HH:mm
  const parseDisplayTime = (displayStr: string) => {
    if (!displayStr) return "";

    const cleaned = displayStr.trim().toLowerCase();

    try {
      if (timeFormat === 12) {
        const ampmMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
        if (ampmMatch?.[1] && ampmMatch?.[2] && ampmMatch?.[3]) {
          const [, hours, minutes, ampm] = ampmMatch;
          let hour = Number.parseInt(hours, 10);
          const min = Number.parseInt(minutes, 10);

          if (ampm === "pm" && hour !== 12) hour += 12;
          if (ampm === "am" && hour === 12) hour = 0;

          return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        }
      }

      const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch?.[1] && timeMatch?.[2]) {
        const [, hours, minutes] = timeMatch;
        const hour = Number.parseInt(hours, 10);
        const min = Number.parseInt(minutes, 10);

        if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
          return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        }
      }
    } catch {
      // Invalid input
    }

    return "";
  };

  // Update input value when external value changes
  useEffect(() => {
    const formatted = formatTime(value);
    setInputValue(formatted);
  }, [value, timeFormat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Remove any non-digit characters except for AM/PM indicators
    const digitsOnly = rawValue.replace(/[^\d\s]/g, "");

    // Handle automatic formatting as user types
    let formattedValue = "";

    if (digitsOnly.length === 0) {
      setInputValue("");
      onChange("");
      return;
    }

    // Auto-format based on input length
    if (digitsOnly.length <= 2) {
      formattedValue = digitsOnly;
    } else if (digitsOnly.length <= 4) {
      const hours = digitsOnly.slice(0, 2);
      const minutes = digitsOnly.slice(2);
      formattedValue = `${hours}:${minutes}`;
    } else {
      const hours = digitsOnly.slice(0, 2);
      const minutes = digitsOnly.slice(2, 4);
      formattedValue = `${hours}:${minutes}`;
    }

    // For 12-hour format, check if user is typing AM/PM
    if (timeFormat === 12) {
      const ampmMatch = rawValue.match(/\s*(am|pm|a|p)/i);
      if (ampmMatch?.[1]) {
        const ampm = ampmMatch[1].toLowerCase();
        if (ampm === "a" || ampm === "am") {
          formattedValue += " AM";
        } else if (ampm === "p" || ampm === "pm") {
          formattedValue += " PM";
        }
      } else if (formattedValue.length >= 4) {
        const hourPart = formattedValue.split(":")[0];
        if (hourPart) {
          const hour = Number.parseInt(hourPart, 10);
          if (hour >= 1 && hour <= 12) {
            formattedValue += " AM";
          }
        }
      }
    }

    setInputValue(formattedValue);

    // Parse and validate the formatted time
    const parsed = parseDisplayTime(formattedValue);
    if (parsed) {
      onChange(parsed);
    }
  };

  const stepTime = (direction: "up" | "down") => {
    if (!value) {
      const now = new Date();
      const defaultTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      onChange(defaultTime);
      return;
    }

    try {
      const currentTime = parse(value, "HH:mm", new Date());
      const increment = direction === "up" ? 1 : -1;
      const newTime = new Date(currentTime.getTime() + increment * 60000);

      const newValue = format(newTime, "HH:mm");
      onChange(newValue);
    } catch {
      // Handle invalid time
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      stepTime("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepTime("down");
    } else if (e.key === "Tab") {
      return;
    } else if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(formatTime(value));
      inputRef.current?.blur();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      return;
    } else if (e.key === ":") {
      e.preventDefault();
      return;
    } else if (
      !/^\d$/.test(e.key) &&
      !["a", "p", "m", "A", "P", "M", " "].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    const parsed = parseDisplayTime(inputValue);
    if (parsed) {
      setInputValue(formatTime(parsed));
    } else {
      setInputValue(formatTime(value));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="bg-transparent focus:outline-none text-sm min-w-[80px]"
      placeholder={timeFormat === 12 ? "12:00 PM" : "12:00"}
    />
  );
}

export function TimeRangeInput({
  value,
  onChange,
  timeFormat = 24,
}: {
  value: { start: string | undefined; stop: string | undefined };
  onChange: (value: { start: string; stop: string }) => void;
  timeFormat?: number;
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
    const stop = parse(stopTime, "HH:mm", new Date());
    const diff = differenceInMinutes(stop, start);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    setDuration(`${hours}h ${minutes}min`);
  }, [startTime, stopTime]);

  return (
    <div className="flex items-center w-full border border-border px-4 py-2">
      <div className="flex items-center space-x-2 flex-1">
        <Icons.Time className="w-5 h-5 text-[#878787]" />
        <TimeInput
          value={startTime}
          onChange={(newValue) => {
            setStartTime(newValue);
            onChange({ start: newValue, stop: stopTime });
          }}
          timeFormat={timeFormat}
        />
      </div>
      <div className="flex items-center justify-center flex-shrink-0 mx-4">
        <Icons.ArrowRightAlt className="w-5 h-5 text-[#878787]" />
      </div>
      <div className="flex items-center space-x-2 flex-1 justify-end">
        <TimeInput
          value={stopTime}
          onChange={(newValue) => {
            setStopTime(newValue);
            onChange({ start: startTime, stop: newValue });
          }}
          timeFormat={timeFormat}
        />
        <span className="text-[#878787] text-sm">{duration}</span>
      </div>
    </div>
  );
}
