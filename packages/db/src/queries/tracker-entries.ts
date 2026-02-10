import {
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Database } from "../client";
import { teams, trackerEntries, trackerProjects } from "../schema";
import { createActivity } from "./activities";

type GetTrackerRecordsByDateParams = {
  teamId: string;
  date: string;
  projectId?: string;
  userId?: string;
};

export async function getTrackerRecordsByDate(
  db: Database,
  params: GetTrackerRecordsByDateParams,
) {
  const { teamId, projectId, date, userId } = params;

  // Build the where conditions array
  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    eq(trackerEntries.date, date),
  ];

  // Add optional conditions
  if (projectId) {
    whereConditions.push(eq(trackerEntries.projectId, projectId));
  }

  if (userId) {
    whereConditions.push(eq(trackerEntries.assignedId, userId));
  }

  const data = await db.query.trackerEntries.findMany({
    where: and(...whereConditions),
    columns: {
      id: true,
      start: true,
      stop: true,
      duration: true,
      date: true,
      description: true,
    },
    with: {
      user: true,
      trackerProject: {
        columns: {
          id: true,
          name: true,
          rate: true,
          currency: true,
        },
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Calculate total duration
  const totalDuration = data.reduce(
    (duration, item) => (item.duration ?? 0) + duration,
    0,
  );

  return {
    meta: {
      totalDuration,
    },
    data,
  };
}

export type GetTrackerRecordsByRangeParams = {
  teamId: string;
  from: string;
  to: string;
  projectId?: string;
  userId?: string;
};

export async function getTrackerRecordsByRange(
  db: Database,
  params: GetTrackerRecordsByRangeParams,
) {
  const { teamId, from, to, projectId, userId } = params;

  // Build the where conditions array
  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    // Use gte and lte for date range
    gte(trackerEntries.date, from),
    lte(trackerEntries.date, to),
  ];

  // Add optional conditions
  if (projectId) {
    whereConditions.push(eq(trackerEntries.projectId, projectId));
  }

  if (userId) {
    whereConditions.push(eq(trackerEntries.assignedId, userId));
  }

  const data = await db.query.trackerEntries.findMany({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: trackerEntries.createdAt,
  });

  const dataWithProject = data.map((item) => ({
    ...item,
    project: item.trackerProject,
  }));

  // Group entries by date
  type EntryType = (typeof dataWithProject)[number];
  const result = dataWithProject.reduce<Record<string, EntryType[]>>(
    (acc, item) => {
      if (item.date) {
        const dateKey = item.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
      }
      return acc;
    },
    {},
  );

  // Calculate total duration
  const totalDuration = data.reduce(
    (duration, item) => duration + (item.duration ?? 0),
    0,
  );

  // Calculate total amount
  const totalAmount = data.reduce((amount, item) => {
    const rate = item.trackerProject?.rate ?? 0;
    const duration = item.duration ?? 0;
    return amount + (Number(rate) * duration) / 3600;
  }, 0);

  return {
    meta: {
      totalDuration,
      totalAmount,
      from,
      to,
    },
    result,
  };
}

export type UpsertTrackerEntriesParams = {
  id?: string;
  teamId: string;
  start: string;
  stop: string;
  dates: string[];
  assignedId?: string | null;
  projectId: string;
  description?: string | null;
  duration: number;
};

export async function upsertTrackerEntries(
  db: Database,
  params: UpsertTrackerEntriesParams,
) {
  const { dates, id, teamId, ...rest } = params;

  // Create entries for each date
  const entries = dates.map((date) => ({
    ...(id ? { id } : {}),
    teamId,
    date,
    start: rest.start,
    stop: rest.stop,
    assignedId: rest.assignedId,
    projectId: rest.projectId,
    description: rest.description,
    duration: rest.duration,
  }));

  // Perform the upsert operation
  const upsertResult = await db
    .insert(trackerEntries)
    .values(entries)
    .onConflictDoUpdate({
      target: [trackerEntries.id],
      set: {
        start: rest.start,
        stop: rest.stop,
        assignedId: rest.assignedId,
        projectId: rest.projectId,
        description: rest.description,
        duration: rest.duration,
      },
    })
    .returning({ id: trackerEntries.id });

  // Create activity for new tracker entries (not updates)
  // If no id was provided in params, this is a new entry
  if (!id && upsertResult.length > 0) {
    // Create activity for each new entry
    for (const entry of upsertResult) {
      createActivity(db, {
        teamId,
        userId: rest.assignedId || undefined,
        type: "tracker_entry_created",
        source: "user",
        priority: 7,
        metadata: {
          entryId: entry.id,
          projectId: rest.projectId,
          duration: rest.duration,
          dates: dates,
          description: rest.description,
        },
      });
    }
  }

  // Build where conditions
  const whereConditions = [eq(trackerEntries.teamId, teamId)];

  if (id) {
    whereConditions.push(eq(trackerEntries.id, id));
  }

  // Handle date filtering
  if (dates.length > 0) {
    whereConditions.push(inArray(trackerEntries.date, dates));
  }

  // Fetch the updated entries with related data
  const result = await db.query.trackerEntries.findMany({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  return result;
}

export type BulkCreateTrackerEntriesParams = {
  teamId: string;
  entries: Array<{
    start: string;
    stop: string;
    dates: string[];
    assignedId?: string | null;
    projectId: string;
    description?: string | null;
    duration: number;
  }>;
};

export async function bulkCreateTrackerEntries(
  db: Database,
  params: BulkCreateTrackerEntriesParams,
) {
  const { teamId, entries } = params;

  // Flatten all entries and their dates into a single array for bulk insert
  const flatEntries = entries.flatMap((entry) =>
    entry.dates.map((date) => ({
      teamId,
      date,
      start: entry.start,
      stop: entry.stop,
      assignedId: entry.assignedId,
      projectId: entry.projectId,
      description: entry.description,
      duration: entry.duration,
    })),
  );

  if (flatEntries.length === 0) {
    return [];
  }

  // Insert all entries in a single database operation
  const insertedEntries = await db
    .insert(trackerEntries)
    .values(flatEntries)
    .returning({
      id: trackerEntries.id,
    });

  // Get all inserted IDs
  const insertedIds = insertedEntries.map((entry) => entry.id);

  // Fetch the complete entries with related data
  const result = await db.query.trackerEntries.findMany({
    where: and(
      eq(trackerEntries.teamId, teamId),
      inArray(trackerEntries.id, insertedIds),
    ),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  return result;
}

export type DeleteTrackerEntryParams = {
  teamId: string;
  id: string;
};

export async function deleteTrackerEntry(
  db: Database,
  params: DeleteTrackerEntryParams,
) {
  const { teamId, id } = params;

  const [result] = await db
    .delete(trackerEntries)
    .where(and(eq(trackerEntries.id, id), eq(trackerEntries.teamId, teamId)))
    .returning({
      id: trackerEntries.id,
    });

  return result;
}

// Timer-related types and functions
export type StartTimerParams = {
  teamId: string;
  projectId: string;
  assignedId?: string | null;
  description?: string | null;
  start?: string;
};

export type StopTimerParams = {
  teamId: string;
  entryId?: string;
  assignedId?: string | null;
  stop?: string;
};

export type GetCurrentTimerParams = {
  teamId: string;
  assignedId?: string | null;
};

export type GetTimerStatusParams = {
  teamId: string;
  assignedId?: string | null;
};

/**
 * Start a new timer
 */
export async function startTimer(db: Database, params: StartTimerParams) {
  const { teamId, projectId, assignedId, description, start } = params;

  const startTime = start || new Date().toISOString();
  const currentDate = new Date(startTime).toISOString().split("T")[0];

  // First, stop any currently running timer for this user
  if (assignedId) {
    await stopCurrentRunningTimer(db, { teamId, assignedId });
  }

  // Create a new running entry
  const [newEntry] = await db
    .insert(trackerEntries)
    .values({
      teamId,
      projectId,
      assignedId,
      description,
      start: startTime,
      stop: null,
      duration: null, // null indicates running
      date: currentDate,
    })
    .returning({ id: trackerEntries.id });

  if (!newEntry) {
    throw new Error("Failed to create timer entry");
  }

  const entryId = newEntry.id;

  // Fetch the complete entry with related data
  const result = await db.query.trackerEntries.findFirst({
    where: eq(trackerEntries.id, entryId),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new Error("Failed to fetch created timer entry");
  }

  return {
    ...result,
    project: result.trackerProject,
  };
}

/**
 * Stop the current running timer
 */
export async function stopTimer(db: Database, params: StopTimerParams) {
  const { teamId, entryId, assignedId, stop } = params;

  const stopTime = stop || new Date().toISOString();

  let targetEntryId = entryId;

  if (!targetEntryId) {
    // Find the current running timer for the user
    const runningTimer = await getCurrentRunningTimer(db, {
      teamId,
      assignedId,
    });

    if (!runningTimer) {
      throw new Error("No running timer found to stop");
    }

    targetEntryId = runningTimer.id;
  }

  // Get the entry to calculate duration
  const whereConditions = [
    eq(trackerEntries.id, targetEntryId),
    eq(trackerEntries.teamId, teamId),
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const entry = await db.query.trackerEntries.findFirst({
    where: and(...whereConditions),
  });

  if (!entry) {
    throw new Error("Timer entry not found");
  }

  if (entry.stop) {
    throw new Error("Timer is already stopped");
  }

  if (!entry.start) {
    throw new Error("Timer has no start time");
  }

  // Calculate duration in seconds
  const startTime = new Date(entry.start).getTime();
  const stopTime_ms = new Date(stopTime).getTime();
  const duration = Math.floor((stopTime_ms - startTime) / 1000);

  // Minimum duration threshold (60 seconds)
  const MIN_DURATION_SECONDS = 60;

  // If duration is too short, delete the entry instead of saving
  if (duration < MIN_DURATION_SECONDS) {
    // Get project info before deleting for the response
    const projectInfo = await db.query.trackerProjects.findFirst({
      where: eq(trackerProjects.id, entry.projectId!),
      columns: {
        id: true,
        name: true,
      },
    });

    // Delete the entry
    await db.delete(trackerEntries).where(eq(trackerEntries.id, targetEntryId));

    return {
      id: targetEntryId,
      discarded: true,
      duration,
      project: projectInfo,
      trackerProject: projectInfo,
      start: entry.start,
      stop: entry.stop,
      description: entry.description,
    };
  }

  // Update the entry with stop time and duration
  await db
    .update(trackerEntries)
    .set({
      stop: stopTime,
      duration,
    })
    .where(eq(trackerEntries.id, targetEntryId));

  // Fetch the updated entry with related data
  const result = await db.query.trackerEntries.findFirst({
    where: eq(trackerEntries.id, targetEntryId),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new Error("Failed to fetch updated timer entry");
  }

  return {
    ...result,
    discarded: false,
    project: result.trackerProject,
  };
}

/**
 * Get the current running timer for a user
 */
export async function getCurrentTimer(
  db: Database,
  params: GetCurrentTimerParams,
) {
  const { teamId, assignedId } = params;

  // Only include timers that started between today (00:00) and tomorrow (00:00) to handle midnight running
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    // stop is null means it's running
    isNull(trackerEntries.stop),
    gte(trackerEntries.start, today.toISOString()),
    lte(trackerEntries.start, tomorrow.toISOString()),
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const result = await db.query.trackerEntries.findFirst({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      trackerProject: {
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    return null;
  }

  return {
    ...result,
    project: result.trackerProject,
  };
}

/**
 * Get timer status including elapsed time
 */
export async function getTimerStatus(
  db: Database,
  params: GetTimerStatusParams,
) {
  const currentTimer = await getCurrentTimer(db, params);

  if (!currentTimer) {
    return {
      isRunning: false,
      currentEntry: null,
      elapsedTime: 0,
    };
  }

  // Calculate elapsed time
  let elapsedTime = 0;
  if (currentTimer.start) {
    const startTime = new Date(currentTimer.start).getTime();
    const currentTime = Date.now();
    elapsedTime = Math.floor((currentTime - startTime) / 1000);
  }

  return {
    isRunning: true,
    currentEntry: {
      id: currentTimer.id,
      start: currentTimer.start,
      description: currentTimer.description,
      projectId: currentTimer.projectId ?? null,
      trackerProject: {
        id: currentTimer.trackerProject?.id ?? null,
        name: currentTimer.trackerProject?.name ?? null,
      },
    },
    elapsedTime,
  };
}

/**
 * Helper function to get the current running timer (internal use)
 */
async function getCurrentRunningTimer(
  db: Database,
  params: GetCurrentTimerParams,
) {
  const { teamId, assignedId } = params;

  // Only include timers that started between today (00:00) and tomorrow (00:00) to handle midnight running
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    isNull(trackerEntries.stop),
    gte(trackerEntries.start, today.toISOString()),
    lte(trackerEntries.start, tomorrow.toISOString()),
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  return db.query.trackerEntries.findFirst({
    where: and(...whereConditions),
  });
}

/**
 * Helper function to stop any currently running timer for a user
 */
async function stopCurrentRunningTimer(
  db: Database,
  params: { teamId: string; assignedId: string },
) {
  const runningTimer = await getCurrentRunningTimer(db, params);

  if (runningTimer?.start) {
    const stopTime = new Date().toISOString();
    const startTime = new Date(runningTimer.start).getTime();
    const stopTime_ms = new Date(stopTime).getTime();
    const duration = Math.floor((stopTime_ms - startTime) / 1000);

    await db
      .update(trackerEntries)
      .set({
        stop: stopTime,
        duration,
      })
      .where(eq(trackerEntries.id, runningTimer.id));
  }
}

export type GetTrackedTimeParams = {
  teamId: string;
  from: string;
  to: string;
  assignedId?: string;
};

export async function getTrackedTime(
  db: Database,
  params: GetTrackedTimeParams,
) {
  const { teamId, from, to, assignedId } = params;

  // Build the where conditions array
  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    gte(trackerEntries.date, from),
    lte(trackerEntries.date, to),
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const entries = await db.query.trackerEntries.findMany({
    where: and(...whereConditions),
    columns: {
      duration: true,
    },
  });

  // Calculate total duration including running timers
  let totalDuration = 0;

  for (const entry of entries) {
    if (entry.duration) {
      totalDuration += entry.duration;
    }
  }

  return {
    totalDuration,
    from,
    to,
  };
}

export type GetBillableHoursParams = {
  teamId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  view: "week" | "month";
  weekStartsOnMonday?: boolean;
};

export type BillableHoursResult = {
  totalDuration: number;
  totalAmount: number;
  earningsByCurrency: Record<string, number>;
  projectBreakdown: Array<{
    id: string;
    name: string;
    duration: number;
    amount: number;
    currency: string;
  }>;
  currency: string;
};

export async function getBillableHours(
  db: Database,
  params: GetBillableHoursParams,
): Promise<BillableHoursResult> {
  const { teamId, date, view, weekStartsOnMonday = false } = params;

  const currentDate = new Date(date);
  let from: string;
  let to: string;

  if (view === "week") {
    const weekStart = startOfWeek(currentDate, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });
    const weekEnd = endOfWeek(currentDate, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });
    from = formatISO(weekStart, { representation: "date" });
    to = formatISO(weekEnd, { representation: "date" });
  } else {
    // Month view: Add 1-day buffer before and after to handle midnight-spanning entries
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const extendedStart = new Date(monthStart);
    extendedStart.setDate(extendedStart.getDate() - 1);

    const extendedEnd = new Date(monthEnd);
    extendedEnd.setDate(extendedEnd.getDate() + 1);

    from = formatISO(extendedStart, { representation: "date" });
    to = formatISO(extendedEnd, { representation: "date" });
  }

  const data = await getTrackerRecordsByRange(db, {
    teamId,
    from,
    to,
  });

  // Get the team's base currency
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      baseCurrency: true,
    },
  });

  const baseCurrency = team?.baseCurrency || "USD";

  if (!data?.result) {
    return {
      totalDuration: 0,
      totalAmount: 0,
      earningsByCurrency: {},
      projectBreakdown: [],
      currency: baseCurrency,
    };
  }

  let totalDuration = 0;
  const earningsByCurrency: Record<string, number> = {};
  const projects: Record<
    string,
    {
      id: string;
      name: string;
      duration: number;
      amount: number;
      currency: string;
    }
  > = {};

  // Iterate through all days and entries
  for (const entry of Object.values(data.result).flat()) {
    // Count ALL durations (matching CalendarHeader)
    if (entry.duration) {
      totalDuration += entry.duration;
    }

    // Only count earnings from billable projects with rates (matching TotalEarnings)
    if (
      entry.trackerProject?.billable &&
      entry.trackerProject?.rate &&
      entry.duration
    ) {
      const projectId = entry.trackerProject.id;
      const projectName = entry.trackerProject.name;
      const currency = entry.trackerProject.currency || baseCurrency;
      const rate = Number(entry.trackerProject.rate);
      const hours = entry.duration / 3600;
      const earning = rate * hours;

      // Earnings by currency
      earningsByCurrency[currency] =
        (earningsByCurrency[currency] || 0) + earning;

      // Project breakdown
      if (projects[projectId]) {
        projects[projectId].duration += entry.duration;
        projects[projectId].amount += earning;
      } else {
        projects[projectId] = {
          id: projectId,
          name: projectName,
          duration: entry.duration,
          amount: earning,
          currency,
        };
      }
    }
  }

  // Calculate total amount in base currency only
  const totalAmount = earningsByCurrency[baseCurrency] || 0;

  return {
    totalDuration,
    totalAmount,
    earningsByCurrency,
    projectBreakdown: Object.values(projects).sort(
      (a, b) => b.amount - a.amount,
    ),
    currency: baseCurrency,
  };
}

export type GetTrackerEntryByIdParams = {
  id: string;
  teamId: string;
};

export async function getTrackerEntryById(
  db: Database,
  params: GetTrackerEntryByIdParams,
) {
  const { id, teamId } = params;

  const entry = await db.query.trackerEntries.findFirst({
    where: and(eq(trackerEntries.id, id), eq(trackerEntries.teamId, teamId)),
  });

  return entry ?? null;
}
