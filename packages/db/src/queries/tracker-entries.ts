import type { Database } from "@db/client";
import { trackerEntries } from "@db/schema";
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";

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
  await db
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
    });

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
