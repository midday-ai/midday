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
  formatTimeFromDate,
  getDates,
  getSlotFromDate,
  isValidTimeSlot,
} from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
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
  differenceInSeconds,
  endOfDay,
  format,
  isAfter,
  isValid,
  parse,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerEntriesForm } from "./forms/tracker-entries-form";
import { TrackerDaySelect } from "./tracker-day-select";

type TrackerRecord = NonNullable<
  RouterOutputs["trackerEntries"]["byDate"]["data"]
>[number];

type ProcessedScheduleEntry = TrackerRecord & {
  isFirstPart: boolean;
  originalDuration: number | null;
  displayStart: string | null;
  displayStop: string | null;
};

const ROW_HEIGHT = 36;
const SLOT_HEIGHT = 9;

// Safe utilities for working with potentially null date strings
const safeGetSlot = (dateStr: string | null): number => {
  return getSlotFromDate(createSafeDate(dateStr));
};

const safeFormatTime = (
  dateStr: string | null,
  userTimezone?: string,
  isNewEvent?: boolean,
): string => {
  if (!dateStr) return "";

  const utcDate = createSafeDate(dateStr);

  // Only convert timezone for saved events, not for new events being typed
  if (!isNewEvent && userTimezone && userTimezone !== "UTC") {
    try {
      const converted = utcDate.toLocaleString("en-US", {
        timeZone: userTimezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      return converted;
    } catch (error) {
      console.warn("Display timezone conversion failed:", error);
    }
  }

  // For new events or UTC fallback, just format as is
  return format(utcDate, "HH:mm");
};

const safeCalculateDuration = (
  start: string | null,
  stop: string | null,
): number => {
  return calculateDuration(createSafeDate(start), createSafeDate(stop));
};

const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
  selectedDate?: string | null,
  projects?: RouterOutputs["trackerProjects"]["get"]["data"],
  userTimezone?: string,
): TrackerRecord => {
  const baseDate = selectedDate ? parseISO(selectedDate) : new Date();
  let startDate = setMinutes(
    setHours(baseDate, Math.floor(slot / 4)),
    (slot % 4) * 15,
  );
  let endDate = addMinutes(startDate, 15);

  // Convert from user timezone to UTC for storage
  if (userTimezone && userTimezone !== "UTC") {
    try {
      const startTime = format(startDate, "HH:mm");
      const endTime = format(endDate, "HH:mm");
      const baseDateStr = format(baseDate, "yyyy-MM-dd");

      const startDateStr = `${baseDateStr}T${startTime}:00`;
      const endDateStr = `${baseDateStr}T${endTime}:00`;

      const startInUserTz = new TZDate(startDateStr, userTimezone);
      const endInUserTz = new TZDate(endDateStr, userTimezone);

      startDate = new Date(startInUserTz.getTime());
      endDate = new Date(endInUserTz.getTime());
    } catch (error) {
      console.warn("Failed to convert drag/click event to UTC:", error);
    }
  }

  // Find the project name from projects data
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
          const startSlot = safeGetSlot(eventToSelect.start);
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

  // Scroll to appropriate time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      if (currentHour >= 12) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
      } else {
        scrollRef.current.scrollTo({ top: ROW_HEIGHT * 6 });
      }
    }
  }, []);

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
    return selectedDate ? parseISO(selectedDate) : startOfDay(new Date());
  }, [selectedDate]);

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
      const dates = getDates(selectedDate, sortedRange ?? null);
      const baseDate = getBaseDate();
      const userTimezone = user?.timezone || "UTC";

      // Parse times as UTC to avoid browser timezone interference
      const startParts = formValues.start.split(":");
      const stopParts = formValues.stop.split(":");

      const startHour = Number.parseInt(startParts[0] || "0", 10);
      const startMin = Number.parseInt(startParts[1] || "0", 10);
      const stopHour = Number.parseInt(stopParts[0] || "0", 10);
      const stopMin = Number.parseInt(stopParts[1] || "0", 10);

      // Create dates in UTC (neutral timezone)
      let startDate = new Date(
        Date.UTC(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          startHour,
          startMin,
          0,
        ),
      );
      let stopDate = new Date(
        Date.UTC(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          stopHour,
          stopMin,
          0,
        ),
      );

      // If stop time is before start time, assume it's on the next day
      if (stopHour < startHour) {
        stopDate = new Date(
          Date.UTC(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate() + 1,
            stopHour,
            stopMin,
            0,
          ),
        );
      }

      // Convert from user profile timezone to UTC for storage
      if (userTimezone !== "UTC") {
        try {
          // Get the timezone offset for this date in the user's timezone
          const tempDate = new Date(baseDate);
          const offsetInUserTz = new Intl.DateTimeFormat("en", {
            timeZone: userTimezone,
            timeZoneName: "longOffset",
          })
            .formatToParts(tempDate)
            .find((part) => part.type === "timeZoneName")?.value;

          let offsetMinutes = 0;
          if (offsetInUserTz) {
            const match = offsetInUserTz.match(/GMT([+-])(\d{2}):(\d{2})/);
            if (match?.[1] && match?.[2] && match?.[3]) {
              const sign = match[1] === "+" ? 1 : -1; // Positive for ahead of UTC, negative for behind
              const hours = Number.parseInt(match[2], 10);
              const minutes = Number.parseInt(match[3], 10);
              offsetMinutes = sign * (hours * 60 + minutes);
            }
          }

          // Convert from user timezone to UTC: subtract the user's offset
          // If user is GMT-04:00 (offsetMinutes = -240), subtract -240 = add 240 minutes
          const utcStartDate = new Date(
            startDate.getTime() - offsetMinutes * 60000,
          );
          const utcStopDate = new Date(
            stopDate.getTime() - offsetMinutes * 60000,
          );

          startDate = utcStartDate;
          stopDate = utcStopDate;
        } catch (error) {
          console.warn("Manual timezone conversion failed:", error);
        }
      }

      if (!isValid(startDate) || !isValid(stopDate)) {
        return;
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
    [
      selectedDate,
      sortedRange,
      getBaseDate,
      upsertTrackerEntry,
      user?.timezone,
    ],
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
        user?.timezone || undefined,
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
        const startDate = setMinutes(
          setHours(getBaseDate(), Math.floor(start / 4)),
          (start % 4) * 15,
        );
        const endDate = addMinutes(startDate, (end - start + 1) * 15);

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

        const startTime = parse(formattedStartTimeStr, "HH:mm", baseDate);

        if (isValid(startTime)) {
          const endTime = addMinutes(startTime, 15);

          // Clear eventId when creating a new event
          if (eventId) {
            setParams({ eventId: null });
          }

          const newEvent = createNewEvent(
            getSlotFromDate(startTime),
            selectedProjectId,
            selectedDate,
            projectsData?.data,
            user?.timezone || undefined,
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

              const parsedStart = parse(formattedStart, "HH:mm", baseDate);
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

              const parsedEnd = parse(formattedEnd, "HH:mm", baseDate);
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
              false,
            ),
            stop: safeFormatTime(
              eventToUpdate.stop,
              user?.timezone ? user.timezone : undefined,
              false,
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
        const userTimezone = user?.timezone || "UTC";
        let startDateStr: string;
        let endDateStr: string;

        if (userTimezone !== "UTC") {
          try {
            const startInUserTz = new TZDate(startDate, userTimezone);
            const endInUserTz = new TZDate(endDate, userTimezone);
            startDateStr = format(startInUserTz, "yyyy-MM-dd");
            endDateStr = format(endInUserTz, "yyyy-MM-dd");
          } catch {
            // Fallback to UTC if timezone conversion fails
            startDateStr = format(startDate, "yyyy-MM-dd");
            endDateStr = format(endDate, "yyyy-MM-dd");
          }
        } else {
          startDateStr = format(startDate, "yyyy-MM-dd");
          endDateStr = format(endDate, "yyyy-MM-dd");
        }

        const spansMidnight = startDateStr !== endDateStr;

        if (spansMidnight) {
          // This is a split entry - only show the first part (with → arrow)
          const currentSelectedDate =
            selectedDate || format(new Date(), "yyyy-MM-dd");

          if (startDateStr === currentSelectedDate) {
            // This is the first part of the entry (ends at midnight)
            const endOfDay = new Date(startDate);
            endOfDay.setHours(23, 59, 59, 999);
            const firstPartDuration =
              Math.floor((endOfDay.getTime() - startDate.getTime()) / 1000) + 1;

            processedEntries.push({
              ...event,
              duration: firstPartDuration,
              isFirstPart: true,
              originalDuration: event.duration ?? null,
              displayStart: event.start ?? null,
              displayStop: endOfDay.toISOString() ?? null,
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

    return processedEntries.map((event) => {
      const startSlot = safeGetSlot(event.displayStart);
      let endSlot: number;

      // For midnight-spanning entries, extend to end of day
      if (event.isFirstPart) {
        endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
      } else {
        endSlot = safeGetSlot(event.displayStop);
        // Handle midnight crossing - if end slot is before start slot,
        // it means the entry crosses midnight, so extend to end of day
        if (endSlot < startSlot) {
          endSlot = 96; // 24 hours * 4 slots = 96 (end of day)
        }
      }

      const height = (endSlot - startSlot) * SLOT_HEIGHT;

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
                "absolute w-full bg-[#F0F0F0]/[0.95] dark:bg-[#1D1D1D]/[0.95] text-[#606060] dark:text-[#878787] border-t border-border",
                selectedEvent?.id === event.id && "!text-primary",
                event.id !== NEW_EVENT_ID && "cursor-move",
              )}
              style={{
                top: `${startSlot * SLOT_HEIGHT}px`,
                height: `${height}px`,
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
                  {secondsToHoursAndMinutes(event.duration ?? 0)}
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
                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
                    onMouseDown={(e) => handleEventResizeStart(e, event, "top")}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
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
                {formatHour(hour, user?.timeFormat)}
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
                formEvent.id === NEW_EVENT_ID,
              )
            : undefined
        }
        stop={
          formEvent?.stop
            ? safeFormatTime(
                formEvent.stop,
                user?.timezone ? user.timezone : undefined,
                formEvent.id === NEW_EVENT_ID,
              )
            : undefined
        }
        onSelectProject={handleSelectProject}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
}
