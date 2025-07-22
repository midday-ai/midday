"use client";

import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import {
  NEW_EVENT_ID,
  calculateDuration,
  createSafeDate,
  formatHour,
  getDates,
  getSlotFromDate,
  isValidTimeSlot,
  parseTimeWithMidnightCrossing,
} from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate, tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { cn } from "@midday/ui/cn";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerEntriesForm } from "./forms/tracker-entries-form";
import { TrackerDaySelect } from "./tracker-day-select";

/**
 * Converts user input time to UTC using @date-fns/utc
 * @param dateStr - Date in YYYY-MM-DD format
 * @param timeStr - Time in HH:MM format
 * @param timezone - IANA timezone identifier
 * @returns UTC Date object for database storage
 */
const userTimeToUTC = (
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date => {
  try {
    // Create a date in the user's timezone
    const tzDate = tz(timezone);
    const userDate = tzDate(`${dateStr} ${timeStr}`);

    // Return as a regular Date object (which is in UTC)
    return new Date(userDate.getTime());
  } catch (error) {
    console.warn("Timezone conversion failed, falling back to UTC:", {
      dateStr,
      timeStr,
      timezone,
      error,
    });
    // Safe fallback: treat input as UTC using UTCDate
    return new UTCDate(`${dateStr}T${timeStr}:00Z`);
  }
};

/**
 * Displays UTC timestamp in user's preferred timezone using native APIs
 * @param utcDate - UTC Date from database
 * @param timezone - IANA timezone identifier
 * @returns Formatted time string (HH:MM)
 */
const displayInUserTimezone = (utcDate: Date, timezone: string): string => {
  try {
    // Use native Intl API for reliable timezone conversion
    return utcDate.toLocaleString("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Timezone display failed, using UTC:", { timezone, error });
    // Fallback to UTC formatting
    return utcDate.toLocaleString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }
};

/**
 * Converts UTC timestamp to visual slot position using tz() function
 * @param dateStr - UTC timestamp string or null
 * @param userTimezone - User's timezone for display
 * @returns Slot index (0 = midnight, 95 = 23:45)
 */
const safeGetSlot = (dateStr: string | null, userTimezone?: string): number => {
  if (!dateStr) return 0;

  const utcDate = createSafeDate(dateStr);
  const timezone = userTimezone || "UTC";

  try {
    // Use tz() function to create timezone-aware date
    const createTZDate = tz(timezone);
    const tzDate = createTZDate(utcDate);

    const hour = tzDate.getHours();
    const minute = tzDate.getMinutes();
    const slot = hour * 4 + Math.floor(minute / 15);

    return slot;
  } catch (error) {
    console.warn("Slot calculation failed, using native API:", {
      timezone,
      error,
    });
    // Fallback to native toLocaleString
    const userTimeStr = utcDate.toLocaleString("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const [hourStr, minuteStr] = userTimeStr.split(":");
    const hour = Number(hourStr) || 0;
    const minute = Number(minuteStr) || 0;

    return hour * 4 + Math.floor(minute / 15);
  }
};

/**
 * Gets user's timezone with safe fallback
 * @param user - User object with timezone property
 * @returns IANA timezone string
 */
const getUserTimezone = (user?: { timezone?: string | null }): string => {
  return user?.timezone || "UTC";
};

/**
 * Safely formats UTC timestamp for display using library functions
 * @param dateStr - UTC timestamp string
 * @param userTimezone - User's display timezone
 * @returns Formatted time string
 */
const safeFormatTime = (
  dateStr: string | null,
  userTimezone?: string,
): string => {
  if (!dateStr) return "";

  try {
    const utcDate = createSafeDate(dateStr);
    const timezone = userTimezone || "UTC";

    // Try using tz() function first
    const createTZDate = tz(timezone);
    const tzDate = createTZDate(utcDate);

    return format(tzDate, "HH:mm");
  } catch (error) {
    console.warn("Time formatting with tz() failed, using native API:", error);
    // Fallback to displayInUserTimezone
    return displayInUserTimezone(
      createSafeDate(dateStr),
      userTimezone || "UTC",
    );
  }
};

/**
 * Safely calculates duration between timestamps
 * @param start - Start timestamp string
 * @param stop - Stop timestamp string
 * @returns Duration in seconds
 */
const safeCalculateDuration = (
  start: string | null,
  stop: string | null,
): number => {
  if (!start || !stop) return 0;
  return calculateDuration(createSafeDate(start), createSafeDate(stop));
};

type TrackerRecord = NonNullable<
  RouterOutputs["trackerEntries"]["byDate"]["data"]
>[number];

type ProcessedScheduleEntry = TrackerRecord & {
  isFirstPart: boolean;
  originalDuration: number | null;
  displayStart: string | null;
  displayStop: string | null;
};

type PositionedScheduleEntry = ProcessedScheduleEntry & {
  column: number;
  totalColumns: number;
  width: number;
  left: number;
  leftPx?: number; // For pixel-based left positioning in cascading layout
};

/**
 * Detect if two events overlap in time
 */
const eventsOverlap = (
  event1: ProcessedScheduleEntry,
  event2: ProcessedScheduleEntry,
): boolean => {
  if (
    !event1.displayStart ||
    !event1.displayStop ||
    !event2.displayStart ||
    !event2.displayStop
  ) {
    return false;
  }

  const event1Start = new Date(event1.displayStart).getTime();
  const event1End = new Date(event1.displayStop).getTime();
  const event2Start = new Date(event2.displayStart).getTime();
  const event2End = new Date(event2.displayStop).getTime();

  return event1Start < event2End && event2Start < event1End;
};

/**
 * Group overlapping events and calculate positioning
 */
const calculateScheduleEventPositions = (
  entries: ProcessedScheduleEntry[],
): PositionedScheduleEntry[] => {
  if (entries.length === 0) return [];

  // Sort events by start time, then by duration (longer events first)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.displayStart && b.displayStart) {
      const aStart = new Date(a.displayStart).getTime();
      const bStart = new Date(b.displayStart).getTime();
      if (aStart !== bStart) {
        return aStart - bStart;
      }
    }
    // If start times are the same, put longer events first
    const aDuration =
      a.displayStart && a.displayStop
        ? new Date(a.displayStop).getTime() - new Date(a.displayStart).getTime()
        : 0;
    const bDuration =
      b.displayStart && b.displayStop
        ? new Date(b.displayStop).getTime() - new Date(b.displayStart).getTime()
        : 0;
    return bDuration - aDuration;
  });

  // Build overlap groups using a more robust algorithm
  const overlapGroups: ProcessedScheduleEntry[][] = [];
  const processed = new Set<ProcessedScheduleEntry>();

  for (const entry of sortedEntries) {
    if (processed.has(entry)) continue;

    // Start a new group with this entry
    const currentGroup: ProcessedScheduleEntry[] = [entry];
    processed.add(entry);

    // Keep expanding the group until no more overlaps are found
    let foundNewOverlap = true;
    while (foundNewOverlap) {
      foundNewOverlap = false;

      for (const candidate of sortedEntries) {
        if (processed.has(candidate)) continue;

        // Check if this candidate overlaps with ANY event in the current group
        const overlapsWithGroup = currentGroup.some((groupEntry) =>
          eventsOverlap(candidate, groupEntry),
        );

        if (overlapsWithGroup) {
          currentGroup.push(candidate);
          processed.add(candidate);
          foundNewOverlap = true;
          // Don't break here - keep checking other candidates in this iteration
        }
      }
    }

    overlapGroups.push(currentGroup);
  }

  const positionedEntries: PositionedScheduleEntry[] = [];

  // Process each overlap group separately
  for (const group of overlapGroups) {
    if (group.length === 1) {
      // Single event - no overlap, use full width
      const entry = group[0];
      if (entry) {
        positionedEntries.push({
          ...entry,
          column: 0,
          totalColumns: 1,
          width: 100,
          left: 0,
        });
      }
    } else {
      // Multiple overlapping events - use cascading/staggered layout

      // Sort group by start time for proper stacking order
      const sortedGroup = [...group].sort((a, b) => {
        if (a.displayStart && b.displayStart) {
          const aStart = new Date(a.displayStart).getTime();
          const bStart = new Date(b.displayStart).getTime();
          if (aStart !== bStart) {
            return aStart - bStart;
          }
        }
        const aDuration =
          a.displayStart && a.displayStop
            ? new Date(a.displayStop).getTime() -
              new Date(a.displayStart).getTime()
            : 0;
        const bDuration =
          b.displayStart && b.displayStop
            ? new Date(b.displayStop).getTime() -
              new Date(b.displayStart).getTime()
            : 0;
        return bDuration - aDuration;
      });

      sortedGroup.forEach((entry, index) => {
        // Cascading layout parameters
        const offsetStep = 8; // Pixels to offset each event
        const baseWidth = 80; // Width for overlapping events (not the base)
        const widthReduction = 3; // How much to reduce width for each subsequent event

        // Calculate cascading properties
        const totalEvents = sortedGroup.length;

        // First event (index 0) gets full width, others get progressively smaller
        const width =
          index === 0
            ? 100
            : Math.max(60, baseWidth - (index - 1) * widthReduction);

        // Each event is offset to the right (except the first one)
        const leftOffset = index * offsetStep;
        const left = leftOffset;

        positionedEntries.push({
          ...entry,
          column: index,
          totalColumns: totalEvents,
          width,
          left,
          // Add a custom property for pixel-based left positioning
          leftPx: leftOffset,
        });
      });
    }
  }

  return positionedEntries;
};

const ROW_HEIGHT = 36;
const SLOT_HEIGHT = 9;

/**
 * Creates new tracker event from user interaction
 * @param slot - Visual slot position (0-95)
 * @param selectedProjectId - Project ID or null
 * @param selectedDate - Date string or null
 * @param projects - Available projects data
 * @param user - User object with timezone
 * @returns New TrackerRecord
 */
const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
  selectedDate?: string | null,
  projects?: RouterOutputs["trackerProjects"]["get"]["data"],
  user?: { timezone?: string | null },
): TrackerRecord => {
  // Get base date for event
  let baseDate: Date;
  if (selectedDate) {
    baseDate = parseISO(selectedDate);
  } else {
    const timezone = getUserTimezone(user);
    try {
      const now = new Date();
      const userTzDate = new TZDate(now, timezone);
      baseDate = startOfDay(userTzDate);
    } catch (error) {
      console.warn("Today calculation failed, using system date:", error);
      baseDate = new Date();
    }
  }
  const dateStr = format(baseDate, "yyyy-MM-dd");
  const timezone = getUserTimezone(user);

  // Convert slot to time
  const hour = Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  const startTimeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  // 15-minute default duration
  const endMinute = minute + 15;
  const endHour = endMinute >= 60 ? hour + 1 : hour;
  const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
  const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(finalEndMinute).padStart(2, "0")}`;

  // Convert to UTC for storage
  const startDate = userTimeToUTC(dateStr, startTimeStr, timezone);
  const endDate = userTimeToUTC(dateStr, endTimeStr, timezone);

  // Find project details
  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return {
    id: NEW_EVENT_ID,
    date: format(baseDate, "yyyy-MM-dd"),
    description: null,
    duration: 15 * 60,
    start: startDate.toISOString(),
    stop: endDate.toISOString(),
    user: null,
    trackerProject: selectedProjectId
      ? {
          id: selectedProjectId,
          name: selectedProject?.name || "",
          currency: selectedProject?.currency || null,
          rate: selectedProject?.rate || null,
          customer: selectedProject?.customer || null,
        }
      : null,
  };
};

const updateEventTime = (
  event: TrackerRecord,
  start: Date,
  stop: Date,
): TrackerRecord => {
  return {
    ...event,
    start: start.toISOString(),
    stop: stop.toISOString(),
    duration: calculateDuration(start, stop),
  };
};

// Hook for managing tracker data
const useTrackerData = (selectedDate: string | null) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [data, setData] = useState<TrackerRecord[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  const { data: trackerData, refetch } = useQuery({
    ...trpc.trackerEntries.byDate.queryOptions(
      { date: selectedDate ?? "" },
      {
        enabled: !!selectedDate,
      },
    ),
  });

  const deleteTrackerEntry = useMutation(
    trpc.trackerEntries.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byRange.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });
        refetch();
      },
    }),
  );

  const upsertTrackerEntry = useMutation(
    trpc.trackerEntries.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byRange.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });
        refetch();
      },
    }),
  );

  // Process API data
  useEffect(() => {
    if (trackerData?.data) {
      setData(trackerData.data);
      setTotalDuration(trackerData.meta?.totalDuration || 0);
    } else {
      setData([]);
      setTotalDuration(0);
    }
  }, [trackerData]);

  return {
    data,
    setData,
    totalDuration,
    deleteTrackerEntry,
    upsertTrackerEntry,
  };
};

// Hook for managing selected event
const useSelectedEvent = () => {
  const [selectedEvent, setSelectedEvent] = useState<TrackerRecord | null>(
    null,
  );

  const selectEvent = useCallback((event: TrackerRecord | null) => {
    setSelectedEvent(event);
  }, []);

  const clearNewEvent = useCallback(
    (setData: React.Dispatch<React.SetStateAction<TrackerRecord[]>>) => {
      if (selectedEvent?.id === NEW_EVENT_ID) {
        setData((prevData) => prevData.filter((e) => e.id !== NEW_EVENT_ID));
        setSelectedEvent(null);
      }
    },
    [selectedEvent],
  );

  return {
    selectedEvent,
    selectEvent,
    clearNewEvent,
  };
};

export function TrackerSchedule() {
  const { data: user } = useUserQuery();
  const {
    selectedDate,
    range,
    projectId: urlProjectId,
    eventId,
    setParams,
  } = useTrackerParams();
  const { latestProjectId } = useLatestProjectId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trpc = useTRPC();

  // Load projects to get project names
  const { data: projectsData } = useQuery(
    trpc.trackerProjects.get.queryOptions({
      pageSize: 100,
    }),
  );

  const {
    data,
    setData,
    totalDuration,
    deleteTrackerEntry,
    upsertTrackerEntry,
  } = useTrackerData(selectedDate);

  const { selectedEvent, selectEvent, clearNewEvent } = useSelectedEvent();
  const hasScrolledForEventId = useRef<string | null>(null);

  // Auto-select event when eventId is present in URL
  useEffect(() => {
    if (eventId && data.length > 0) {
      const eventToSelect = data.find((event) => event.id === eventId);
      if (eventToSelect) {
        selectEvent(eventToSelect);

        // Auto-scroll to the event position only once per eventId
        if (scrollRef.current && hasScrolledForEventId.current !== eventId) {
          const userTimezone = getUserTimezone(user);
          const startSlot = safeGetSlot(eventToSelect.start, userTimezone);
          const scrollPosition = startSlot * SLOT_HEIGHT;

          // Add some padding to center the event better
          const containerHeight = scrollRef.current.clientHeight;
          const adjustedScrollPosition = Math.max(
            0,
            scrollPosition - containerHeight / 3,
          );

          scrollRef.current.scrollTo({
            top: adjustedScrollPosition,
            behavior: "smooth",
          });

          // Mark that we've scrolled for this eventId
          hasScrolledForEventId.current = eventId;
        }
      }
    }
  }, [eventId, data, selectEvent]);

  // Reset scroll tracking when eventId changes
  useEffect(() => {
    if (!eventId) {
      hasScrolledForEventId.current = null;
    }
  }, [eventId]);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [resizingEvent, setResizingEvent] = useState<TrackerRecord | null>(
    null,
  );
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeType, setResizeType] = useState<"top" | "bottom" | null>(null);
  const [movingEvent, setMovingEvent] = useState<TrackerRecord | null>(null);
  const [moveStartY, setMoveStartY] = useState(0);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    urlProjectId || latestProjectId || null,
  );

  // Update selectedProjectId when URL projectId or latestProjectId changes
  useEffect(() => {
    setSelectedProjectId(urlProjectId || latestProjectId || null);
  }, [urlProjectId, latestProjectId]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const sortedRange = range?.sort((a, b) => a.localeCompare(b));

  // Scroll to appropriate time on mount (using user timezone)
  useEffect(() => {
    if (scrollRef.current) {
      let currentHour: number;
      try {
        const timezone = getUserTimezone(user);
        const now = new Date();
        const userTzDate = new TZDate(now, timezone);
        currentHour = userTzDate.getHours();
      } catch (error) {
        console.warn("TZDate current hour calculation failed:", error);
        currentHour = new Date().getHours();
      }

      if (currentHour >= 12) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
      } else {
        scrollRef.current.scrollTo({ top: ROW_HEIGHT * 6 });
      }
    }
  }, [user]);

  // Event handlers
  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      if (eventId !== NEW_EVENT_ID) {
        deleteTrackerEntry.mutate({ id: eventId });
        setData((prevData) => prevData.filter((event) => event.id !== eventId));
        selectEvent(null);
      }
    },
    [deleteTrackerEntry, setData, selectEvent],
  );

  const getBaseDate = useCallback(() => {
    if (selectedDate) {
      return parseISO(selectedDate);
    }

    // Get "today" in user's timezone, not browser timezone
    const userTimezone = getUserTimezone(user);
    try {
      const now = new Date();
      const userTzDate = new TZDate(now, userTimezone);
      return startOfDay(userTzDate);
    } catch (error) {
      console.warn("TZDate today calculation failed:", error);
      return startOfDay(new Date());
    }
  }, [selectedDate, user]);

  const handleCreateEvent = useCallback(
    (formValues: {
      id?: string;
      duration: number;
      projectId: string;
      start: string;
      stop: string;
      assignedId?: string;
      description?: string;
    }) => {
      const baseDate = getBaseDate();
      const dateStr = format(baseDate, "yyyy-MM-dd");
      const timezone = getUserTimezone(user);

      // Handle next day stop time (e.g., 23:00-01:00)
      const startHour = Number.parseInt(
        formValues.start.split(":")[0] || "0",
        10,
      );
      const stopHour = Number.parseInt(
        formValues.stop.split(":")[0] || "0",
        10,
      );
      const isNextDay = stopHour < startHour;

      const stopDateStr = isNextDay
        ? format(addDays(baseDate, 1), "yyyy-MM-dd")
        : dateStr;

      // Convert user timezone input to UTC for storage
      const startDate = userTimeToUTC(dateStr, formValues.start, timezone);
      const stopDate = userTimeToUTC(stopDateStr, formValues.stop, timezone);

      if (!isValid(startDate) || !isValid(stopDate)) {
        console.warn("Invalid dates created:", { startDate, stopDate });
        return;
      }

      // Calculate dates array based on where the user expects to see the entry
      // Store entries under the date where they visually start from the user's perspective
      let dates: string[];

      if (sortedRange && sortedRange.length > 0) {
        // For range selections, use the original range logic
        dates = getDates(selectedDate, sortedRange);
      } else {
        // For single date entries, store under the date the user selected
        // The UI will handle displaying the split correctly
        dates = [dateStr];
      }

      const apiData = {
        id: formValues.id === NEW_EVENT_ID ? undefined : formValues.id,
        start: startDate.toISOString(),
        stop: stopDate.toISOString(),
        dates,
        projectId: formValues.projectId,
        description: formValues.description || null,
        duration: formValues.duration,
        assignedId: user?.id || null,
      };

      upsertTrackerEntry.mutate(apiData);
    },
    [selectedDate, sortedRange, getBaseDate, upsertTrackerEntry, user],
  );

  const handleMouseDown = useCallback(
    (slot: number) => {
      if (!isValidTimeSlot(slot)) return;

      clearNewEvent(setData);
      setIsDragging(true);
      setDragStartSlot(slot);

      // Clear eventId when creating a new event
      if (eventId) {
        setParams({ eventId: null });
      }

      const newEvent = createNewEvent(
        slot,
        selectedProjectId,
        selectedDate,
        projectsData?.data,
        user,
      );
      setData((prevData) => [...prevData, newEvent]);
      selectEvent(newEvent);
    },
    [
      clearNewEvent,
      setData,
      selectedProjectId,
      selectedDate,
      selectEvent,
      projectsData,
      eventId,
      setParams,
      user?.timezone,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slot = Math.floor(y / SLOT_HEIGHT);

      if (isDragging && dragStartSlot !== null && selectedEvent) {
        const start = Math.min(dragStartSlot, slot);
        const end = Math.max(dragStartSlot, slot);

        // Use timezone-aware time creation instead of browser timezone
        const dateStr = format(getBaseDate(), "yyyy-MM-dd");
        const timezone = getUserTimezone(user);
        const startHour = Math.floor(start / 4);
        const startMinute = (start % 4) * 15;
        const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;

        const startDate = userTimeToUTC(dateStr, startTimeStr, timezone);
        const endDate = new Date(
          startDate.getTime() + (end - start + 1) * 15 * 60 * 1000,
        );

        const updatedEvent = updateEventTime(selectedEvent, startDate, endDate);
        setData((prevData) =>
          prevData.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event,
          ),
        );
        selectEvent(updatedEvent);
      } else if (resizingEvent && resizingEvent.id !== NEW_EVENT_ID) {
        const deltaY = e.clientY - resizeStartY;
        const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);

        if (resizeType === "bottom") {
          const currentStop = createSafeDate(resizingEvent.stop);
          const newEnd = addMinutes(currentStop, deltaSlots * 15);
          const currentStart = createSafeDate(resizingEvent.start);
          const updatedEvent = updateEventTime(
            resizingEvent,
            currentStart,
            newEnd,
          );
          setData((prevData) =>
            prevData.map((event) =>
              event.id === resizingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        } else if (resizeType === "top") {
          const currentStart = createSafeDate(resizingEvent.start);
          const newStart = addMinutes(currentStart, deltaSlots * 15);
          const currentStop = createSafeDate(resizingEvent.stop);
          const updatedEvent = updateEventTime(
            resizingEvent,
            newStart,
            currentStop,
          );
          setData((prevData) =>
            prevData.map((event) =>
              event.id === resizingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        }
      } else if (movingEvent) {
        const deltaY = e.clientY - moveStartY;
        const deltaSlots = Math.round(deltaY / SLOT_HEIGHT);
        const currentStart = createSafeDate(movingEvent.start);
        const currentStop = createSafeDate(movingEvent.stop);
        const newStart = addMinutes(currentStart, deltaSlots * 15);
        const newEnd = addMinutes(currentStop, deltaSlots * 15);

        // Ensure the event doesn't move before start of day or after end of day
        const dayStart = startOfDay(currentStart);
        const dayEnd = endOfDay(currentStart);

        if (newStart >= dayStart && newEnd <= dayEnd) {
          const updatedEvent = updateEventTime(movingEvent, newStart, newEnd);
          setData((prevData) =>
            prevData.map((event) =>
              event.id === movingEvent.id ? updatedEvent : event,
            ),
          );
          selectEvent(updatedEvent);
        }
      }
    },
    [
      isDragging,
      dragStartSlot,
      selectedEvent,
      resizingEvent,
      resizeStartY,
      resizeType,
      movingEvent,
      moveStartY,
      getBaseDate,
      setData,
      selectEvent,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartSlot(null);
    setResizingEvent(null);
    setResizeType(null);
    setMovingEvent(null);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Keyboard shortcuts
  useHotkeys(
    "backspace",
    () => {
      if (selectedEvent && selectedEvent.id !== NEW_EVENT_ID) {
        handleDeleteEvent(selectedEvent.id);
      }
    },
    [selectedEvent, handleDeleteEvent],
  );

  const handleEventResizeStart = useCallback(
    (e: React.MouseEvent, event: TrackerRecord, type: "top" | "bottom") => {
      if (event.id !== NEW_EVENT_ID) {
        e.stopPropagation();
        setResizingEvent(event);
        setResizeStartY(e.clientY);
        setResizeType(type);
        selectEvent(event);
      }
    },
    [selectEvent],
  );

  const handleEventMoveStart = useCallback(
    (e: React.MouseEvent, event: TrackerRecord) => {
      e.stopPropagation();
      clearNewEvent(setData);
      setMovingEvent(event);
      setMoveStartY(e.clientY);
      selectEvent(event);
    },
    [clearNewEvent, setData, selectEvent],
  );

  const handleEventClick = useCallback(
    (event: TrackerRecord) => {
      clearNewEvent(setData);
      selectEvent(event);
    },
    [clearNewEvent, setData, selectEvent],
  );

  const handleTimeChange = useCallback(
    ({ start, end }: { start?: string; end?: string }) => {
      const baseDate = getBaseDate();
      let currentEvent = data.find((ev) => ev.id === selectedEvent?.id) || null;
      let eventCreated = false;

      const isCompleteStartTime =
        start && (/^\d{4}$/.test(start) || /^\d{2}:\d{2}$/.test(start));

      if (
        start &&
        isCompleteStartTime &&
        !currentEvent &&
        !data.some((ev) => ev.id === NEW_EVENT_ID)
      ) {
        // Format HHMM to HH:mm if necessary
        let formattedStartTimeStr = start;
        if (/^\d{4}$/.test(start)) {
          formattedStartTimeStr = `${start.substring(0, 2)}:${start.substring(2)}`;
        }

        // Use timezone-aware parsing instead of browser timezone
        const dateStr = format(baseDate, "yyyy-MM-dd");
        const timezone = getUserTimezone(user);
        const startTime = userTimeToUTC(
          dateStr,
          formattedStartTimeStr,
          timezone,
        );

        if (isValid(startTime)) {
          const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

          // Clear eventId when creating a new event
          if (eventId) {
            setParams({ eventId: null });
          }

          const timezone = getUserTimezone(user);
          const newEvent = createNewEvent(
            getSlotFromDate(startTime, timezone),
            selectedProjectId,
            selectedDate,
            projectsData?.data,
            user,
          );

          if (newEvent) {
            const timedNewEvent = updateEventTime(newEvent, startTime, endTime);
            setData((prevData) => [
              ...prevData.filter((ev) => ev.id !== NEW_EVENT_ID),
              timedNewEvent,
            ]);
            selectEvent(timedNewEvent);
            currentEvent = timedNewEvent;
            eventCreated = true;
          }
        }
      } else if (currentEvent && !eventCreated) {
        if (start !== undefined || end !== undefined) {
          let newStart: Date = createSafeDate(currentEvent.start);
          let startChanged = false;

          if (start !== undefined) {
            const isCompleteFormat =
              /^\d{4}$/.test(start) || /^\d{2}:\d{2}$/.test(start);
            if (isCompleteFormat) {
              let formattedStart = start;
              if (/^\d{4}$/.test(start))
                formattedStart = `${start.substring(0, 2)}:${start.substring(2)}`;

              // Use timezone-aware parsing instead of browser timezone
              const dateStr = format(baseDate, "yyyy-MM-dd");
              const timezone = getUserTimezone(user);
              const parsedStart = userTimeToUTC(
                dateStr,
                formattedStart,
                timezone,
              );

              if (
                isValid(parsedStart) &&
                parsedStart.getTime() !== newStart.getTime()
              ) {
                newStart = parsedStart;
                startChanged = true;
              }
            }
          }

          let newEnd: Date = createSafeDate(currentEvent.stop);
          let endChanged = false;

          if (end !== undefined) {
            const isCompleteFormat =
              /^\d{4}$/.test(end) || /^\d{2}:\d{2}$/.test(end);
            if (isCompleteFormat) {
              let formattedEnd = end;
              if (/^\d{4}$/.test(end))
                formattedEnd = `${end.substring(0, 2)}:${end.substring(2)}`;

              // Use timezone-aware parsing instead of browser timezone
              const dateStr = format(baseDate, "yyyy-MM-dd");
              const timezone = getUserTimezone(user);
              const parsedEnd = userTimeToUTC(dateStr, formattedEnd, timezone);

              if (
                isValid(parsedEnd) &&
                parsedEnd.getTime() !== newEnd.getTime()
              ) {
                newEnd = parsedEnd;
                endChanged = true;
              }
            }
          }

          if (
            (startChanged || endChanged) &&
            isValid(newStart) &&
            isValid(newEnd)
          ) {
            // If end time is before start time, assume it's on the next day
            if (newEnd < newStart) {
              newEnd = addDays(newEnd, 1);
            }

            const updatedEvent = updateEventTime(
              currentEvent,
              newStart,
              newEnd,
            );
            setData((prevData) =>
              prevData.map((event) =>
                event.id === currentEvent?.id ? updatedEvent : event,
              ),
            );
            if (selectedEvent?.id === currentEvent.id) {
              selectEvent(updatedEvent);
            }
          }
        }
      }
    },
    [
      getBaseDate,
      data,
      selectedEvent,
      selectedProjectId,
      selectedDate,
      setData,
      selectEvent,
      projectsData,
      eventId,
      setParams,
      user?.timezone,
    ],
  );

  const handleSelectProject = useCallback(
    (project: { id: string; name: string }) => {
      setSelectedProjectId(project.id);

      const eventToUpdate = data.find((ev) => ev.id === selectedEvent?.id);
      if (eventToUpdate) {
        const updatedEvent = {
          ...eventToUpdate,
          trackerProject: {
            id: project.id,
            name: project.name,
            currency: null,
            rate: null,
            customer: null,
          },
        };

        setData((prevData) =>
          prevData.map((ev) =>
            ev.id === eventToUpdate.id ? updatedEvent : ev,
          ),
        );

        selectEvent(updatedEvent);

        if (eventToUpdate.id !== NEW_EVENT_ID) {
          const duration = safeCalculateDuration(
            eventToUpdate.start,
            eventToUpdate.stop,
          );
          handleCreateEvent({
            id: eventToUpdate.id,
            start: safeFormatTime(
              eventToUpdate.start,
              user?.timezone ? user.timezone : undefined,
            ),
            stop: safeFormatTime(
              eventToUpdate.stop,
              user?.timezone ? user.timezone : undefined,
            ),
            projectId: project.id,
            description: eventToUpdate.description ?? undefined,
            duration: duration,
          });
        }
      }
    },
    [
      data,
      selectedEvent,
      setData,
      selectEvent,
      handleCreateEvent,
      user?.timezone,
    ],
  );

  const renderScheduleEntries = () => {
    // Process events to handle midnight spanning
    const processedEntries: ProcessedScheduleEntry[] = [];

    if (data) {
      for (const event of data) {
        const startDate = createSafeDate(event.start);
        const endDate = createSafeDate(event.stop);

        // Check if this entry spans midnight by comparing dates in user timezone
        const timezone = getUserTimezone(user);

        // Use TZDate for reliable timezone conversion
        let spansMidnight: boolean;
        let startDateStr: string;
        try {
          const startTzDate = new TZDate(startDate, timezone);
          const endTzDate = new TZDate(endDate, timezone);
          // Use date-fns format with timezone-aware dates
          startDateStr = format(startTzDate, "yyyy-MM-dd");
          const endDateStr = format(endTzDate, "yyyy-MM-dd");

          spansMidnight = startDateStr !== endDateStr;
        } catch (error) {
          console.warn("TZDate midnight detection failed:", error);
          // Fallback to toLocaleString
          startDateStr = startDate.toLocaleString("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const endDateStr = endDate.toLocaleString("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          spansMidnight = startDateStr !== endDateStr;
        }

        if (spansMidnight) {
          // This is a split entry - only show the first part (with → arrow)
          // Get current date in user timezone for midnight-spanning comparison
          let currentSelectedDate: string;
          if (selectedDate) {
            currentSelectedDate = selectedDate;
          } else {
            const timezone = getUserTimezone(user);
            try {
              const now = new Date();
              const userTzDate = new TZDate(now, timezone);
              currentSelectedDate = format(userTzDate, "yyyy-MM-dd");
            } catch (error) {
              console.warn("TZDate today formatting failed:", error);
              currentSelectedDate = format(new Date(), "yyyy-MM-dd");
            }
          }

          if (startDateStr === currentSelectedDate) {
            // This is the first part of the entry (ends at midnight in user timezone)
            // Calculate end of day in user timezone, then convert back to UTC
            const timezone = getUserTimezone(user);
            const endOfDayUtc = userTimeToUTC(
              currentSelectedDate,
              "23:59",
              timezone,
            );

            const firstPartDuration = Math.floor(
              (endOfDayUtc.getTime() - startDate.getTime()) / 1000,
            );

            processedEntries.push({
              ...event,
              duration: firstPartDuration,
              isFirstPart: true,
              originalDuration: event.duration ?? null,
              displayStart: event.start ?? null,
              displayStop: endOfDayUtc.toISOString() ?? null,
            });
          }
          // Skip the continuation part for the next day
        } else {
          // Normal entry that doesn't span midnight
          processedEntries.push({
            ...event,
            isFirstPart: false,
            originalDuration: event.duration ?? null,
            displayStart: event.start ?? null,
            displayStop: event.stop ?? null,
          });
        }
      }
    }

    // Calculate positions for overlapping events
    const positionedEntries = calculateScheduleEventPositions(processedEntries);

    return positionedEntries.map((event) => {
      const userTimezone = getUserTimezone(user);
      const startSlot = safeGetSlot(event.displayStart, userTimezone);
      let endSlot: number;

      // For midnight-spanning entries, extend to end of day
      if (event.isFirstPart) {
        endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
      } else {
        endSlot = safeGetSlot(event.displayStop, userTimezone);
        // Handle midnight crossing - if end slot is before start slot,
        // it means the entry crosses midnight, so extend to end of day
        if (endSlot < startSlot) {
          endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
        }
      }

      // Calculate actual height but enforce minimum for usability
      const actualHeight = (endSlot - startSlot) * SLOT_HEIGHT;
      const minHeight = 24; // Minimum height for interaction (resize handles + content)
      const height = Math.max(actualHeight, minHeight);

      return (
        <ContextMenu
          key={`${event.id}-${event.isFirstPart ? "first" : "normal"}`}
          onOpenChange={(open) => {
            if (!open) {
              setTimeout(() => setIsContextMenuOpen(false), 50);
            } else {
              setIsContextMenuOpen(true);
            }
          }}
        >
          <ContextMenuTrigger>
            <div
              onClick={() => handleEventClick(event)}
              className={cn(
                "absolute bg-[#F0F0F0]/[0.95] dark:bg-[#1D1D1D]/[0.95] text-[#606060] dark:text-[#878787] border-t border-border transition-colors",
                selectedEvent?.id === event.id && "!text-primary",
                event.id !== NEW_EVENT_ID && "cursor-move",
                event.totalColumns > 1 && event.column > 0
                  ? "border border-border"
                  : "",
              )}
              style={{
                top: `${startSlot * SLOT_HEIGHT}px`,
                height: `${height}px`,
                left:
                  event.leftPx !== undefined
                    ? `${event.leftPx}px`
                    : `${event.left}%`,
                width:
                  event.leftPx !== undefined
                    ? `calc(${event.width}% - ${event.leftPx}px)`
                    : `${event.width}%`,
                zIndex: event.totalColumns > 1 ? 20 + event.column : 10,
              }}
              onMouseDown={(e) =>
                event.id !== NEW_EVENT_ID && handleEventMoveStart(e, event)
              }
            >
              <div className="text-xs p-4 flex justify-between flex-col select-none pointer-events-none">
                <span>
                  {event.trackerProject?.name || "No Project"}
                  {event.isFirstPart && " →"}
                  {" ("}
                  {secondsToHoursAndMinutes((endSlot - startSlot) * 15 * 60)}
                  {")"}
                </span>
                {event?.trackerProject?.customer && (
                  <span>{event.trackerProject.customer.name}</span>
                )}
                <span>{event.description}</span>
              </div>
              {event.id !== NEW_EVENT_ID && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/10 transition-colors"
                    onMouseDown={(e) => handleEventResizeStart(e, event, "top")}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/10 transition-colors"
                    onMouseDown={(e) =>
                      handleEventResizeStart(e, event, "bottom")
                    }
                  />
                </>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(event.id);
              }}
            >
              Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    });
  };

  // Find the event to pass to the form
  const formEvent =
    data.find((event) => event.id === NEW_EVENT_ID) || selectedEvent;

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-xl text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </h2>
      </div>

      <TrackerDaySelect />

      <ScrollArea ref={scrollRef} className="h-[calc(100vh-480px)] mt-8">
        <div className="flex text-[#878787] text-xs">
          <div className="w-20 flex-shrink-0 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="pr-4 flex font-mono flex-col"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {formatHour(hour, user?.timeFormat, getUserTimezone(user))}
              </div>
            ))}
          </div>

          <div
            className="relative flex-grow border border-border border-t-0 cursor-default select-none"
            onMouseMove={handleMouseMove}
            onMouseDown={(e) => {
              if (e.button === 0 && !isContextMenuOpen) {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slot = Math.floor(y / SLOT_HEIGHT);
                handleMouseDown(slot);
              }
            }}
          >
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="absolute w-full border-t border-border user-select-none"
                  style={{ top: `${hour * ROW_HEIGHT}px` }}
                />
              </React.Fragment>
            ))}
            {renderScheduleEntries()}
          </div>
        </div>
      </ScrollArea>

      <TrackerEntriesForm
        key={formEvent?.id === NEW_EVENT_ID ? "new" : (formEvent?.id ?? "new")}
        eventId={formEvent?.id}
        onCreate={handleCreateEvent}
        isSaving={upsertTrackerEntry.isPending}
        userId={user?.id || ""}
        teamId={user?.teamId || ""}
        projectId={formEvent?.trackerProject?.id ?? selectedProjectId}
        description={formEvent?.description ?? undefined}
        start={
          formEvent?.start
            ? safeFormatTime(
                formEvent.start,
                user?.timezone ? user.timezone : undefined,
              )
            : undefined
        }
        stop={
          formEvent?.stop
            ? safeFormatTime(
                formEvent.stop,
                user?.timezone ? user.timezone : undefined,
              )
            : undefined
        }
        onSelectProject={handleSelectProject}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
}
