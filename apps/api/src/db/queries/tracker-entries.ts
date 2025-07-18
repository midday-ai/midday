import type { Database } from "@api/db";
import { trackerEntries } from "@api/db/schema";
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";

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

  const [deletedEntry] = await db
    .delete(trackerEntries)
    .where(and(eq(trackerEntries.teamId, teamId), eq(trackerEntries.id, id)))
    .returning();

  if (!deletedEntry) {
    throw new Error("Tracker entry not found");
  }

  return deletedEntry;
}

// Timer functions (improved naming and functionality)
export type StartTimerParams = {
  teamId: string;
  projectId: string;
  assignedId?: string | null;
  description?: string | null;
  start?: string; // ISO 8601 datetime, defaults to now
  continueFromEntry?: string; // Continue from a specific paused entry
};

export async function startTimer(db: Database, params: StartTimerParams) {
  const {
    teamId,
    projectId,
    assignedId,
    description,
    start,
    continueFromEntry,
  } = params;

  // If continuing from a paused entry, resume it
  if (continueFromEntry) {
    const resumeTime = start || new Date().toISOString();

    // First, get the current paused entry to get its accumulated duration
    const pausedEntry = await db.query.trackerEntries.findFirst({
      where: and(
        eq(trackerEntries.id, continueFromEntry),
        eq(trackerEntries.teamId, teamId),
        ...(assignedId ? [eq(trackerEntries.assignedId, assignedId)] : []),
        isNotNull(trackerEntries.stop), // Only resume paused entries
      ),
    });

    if (!pausedEntry) {
      throw new Error("Cannot resume: Entry not found or not paused");
    }

    // Calculate the adjusted start time to preserve accumulated time
    const accumulatedDuration = pausedEntry.duration || 0;
    const adjustedStartTime = new Date(
      new Date(resumeTime).getTime() - accumulatedDuration * 1000,
    ).toISOString();

    const [resumedEntry] = await db
      .update(trackerEntries)
      .set({
        start: adjustedStartTime, // Adjusted start time to preserve accumulated time
        stop: null,
        duration: -1, // Mark as running
      })
      .where(
        and(
          eq(trackerEntries.id, continueFromEntry),
          eq(trackerEntries.teamId, teamId),
          ...(assignedId ? [eq(trackerEntries.assignedId, assignedId)] : []),
          isNotNull(trackerEntries.stop), // Only resume paused entries
        ),
      )
      .returning();

    if (!resumedEntry) {
      throw new Error("Cannot resume: Entry not found or not paused");
    }

    // Fetch complete entry data
    const completeEntry = await db.query.trackerEntries.findFirst({
      where: eq(trackerEntries.id, resumedEntry.id),
      with: {
        user: {
          columns: { id: true, fullName: true, avatarUrl: true },
        },
        trackerProject: {
          with: {
            customer: {
              columns: { id: true, name: true, website: true },
            },
          },
        },
      },
    });

    return completeEntry;
  }

  // Stop any existing running timers for this user
  if (assignedId) {
    const stopTime = new Date().toISOString();
    await db
      .update(trackerEntries)
      .set({
        stop: stopTime,
        duration: sql`EXTRACT(EPOCH FROM (${stopTime}::timestamp - start::timestamp))::integer`,
      })
      .where(
        and(
          eq(trackerEntries.teamId, teamId),
          eq(trackerEntries.assignedId, assignedId),
          eq(trackerEntries.duration, -1), // Only stop running entries
        ),
      );
  }

  // Create new timer entry
  const startTime = start || new Date().toISOString();
  const [newEntry] = await db
    .insert(trackerEntries)
    .values({
      teamId,
      projectId,
      assignedId,
      description,
      start: startTime,
      stop: null,
      duration: -1,
      date: startTime.split("T")[0],
    })
    .returning();

  if (!newEntry) {
    throw new Error("Failed to create timer entry");
  }

  // Fetch complete entry data
  const completeEntry = await db.query.trackerEntries.findFirst({
    where: eq(trackerEntries.id, newEntry.id),
    with: {
      user: {
        columns: { id: true, fullName: true, avatarUrl: true },
      },
      trackerProject: {
        with: {
          customer: {
            columns: { id: true, name: true, website: true },
          },
        },
      },
    },
  });

  return completeEntry;
}

export type StopTimerParams = {
  teamId: string;
  entryId?: string;
  assignedId?: string | null;
  stop?: string;
  duration?: number; // Client-calculated duration including pause time
};

export async function stopTimer(db: Database, params: StopTimerParams) {
  const { teamId, entryId, assignedId, stop, duration } = params;
  const stopTime = stop || new Date().toISOString();

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    eq(trackerEntries.duration, -1), // Only running entries
  ];

  if (entryId) {
    whereConditions.push(eq(trackerEntries.id, entryId));
  }

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  // Use client-calculated duration if provided, otherwise calculate server-side
  const finalDuration =
    duration !== undefined
      ? duration
      : sql`EXTRACT(EPOCH FROM (${stopTime}::timestamp - start::timestamp))::integer`;

  const [stoppedEntry] = await db
    .update(trackerEntries)
    .set({
      stop: stopTime,
      duration: finalDuration,
    })
    .where(and(...whereConditions))
    .returning();

  if (!stoppedEntry) {
    throw new Error("No running timer found");
  }

  // Fetch complete entry data
  const completeEntry = await db.query.trackerEntries.findFirst({
    where: eq(trackerEntries.id, stoppedEntry.id),
    with: {
      user: {
        columns: { id: true, fullName: true, avatarUrl: true },
      },
      trackerProject: {
        with: {
          customer: {
            columns: { id: true, name: true, website: true },
          },
        },
      },
    },
  });

  return completeEntry;
}

export type PauseTimerParams = {
  teamId: string;
  entryId?: string;
  assignedId?: string | null;
  pause?: string;
};

export async function pauseTimer(db: Database, params: PauseTimerParams) {
  const { teamId, entryId, assignedId, pause } = params;
  const pauseTime = pause || new Date().toISOString();

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    eq(trackerEntries.duration, -1), // Only running entries
  ];

  if (entryId) {
    whereConditions.push(eq(trackerEntries.id, entryId));
  }

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const [pausedEntry] = await db
    .update(trackerEntries)
    .set({
      stop: pauseTime,
      duration: sql`EXTRACT(EPOCH FROM (${pauseTime}::timestamp - start::timestamp))::integer`,
    })
    .where(and(...whereConditions))
    .returning();

  if (!pausedEntry) {
    throw new Error("No running timer found");
  }

  // Fetch complete entry data
  const completeEntry = await db.query.trackerEntries.findFirst({
    where: eq(trackerEntries.id, pausedEntry.id),
    with: {
      user: {
        columns: { id: true, fullName: true, avatarUrl: true },
      },
      trackerProject: {
        with: {
          customer: {
            columns: { id: true, name: true, website: true },
          },
        },
      },
    },
  });

  return completeEntry;
}

export type GetCurrentTimerParams = {
  teamId: string;
  assignedId?: string | null;
};

export async function getCurrentTimer(
  db: Database,
  params: GetCurrentTimerParams,
) {
  const { teamId, assignedId } = params;

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    eq(trackerEntries.duration, -1), // Only running entries
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const runningEntry = await db.query.trackerEntries.findFirst({
    where: and(...whereConditions),
    with: {
      user: {
        columns: { id: true, fullName: true, avatarUrl: true },
      },
      trackerProject: {
        with: {
          customer: {
            columns: { id: true, name: true, website: true },
          },
        },
      },
    },
    orderBy: trackerEntries.createdAt,
  });

  return runningEntry;
}

export type GetTimerStatusParams = {
  teamId: string;
  assignedId?: string | null;
};

export async function getTimerStatus(
  db: Database,
  params: GetTimerStatusParams,
) {
  const { teamId, assignedId } = params;

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    eq(trackerEntries.duration, -1),
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const runningEntry = await db.query.trackerEntries.findFirst({
    where: and(...whereConditions),
    columns: {
      id: true,
      start: true,
      description: true,
      projectId: true,
    },
    with: {
      trackerProject: {
        columns: { id: true, name: true },
      },
    },
  });

  return {
    isRunning: !!runningEntry,
    currentEntry: runningEntry,
    // Calculate elapsed time for running entries
    elapsedTime: runningEntry?.start
      ? Math.floor(
          (new Date().getTime() - new Date(runningEntry.start).getTime()) /
            1000,
        )
      : 0,
  };
}

export type GetPausedTimersParams = {
  teamId: string;
  assignedId?: string | null;
};

export async function getPausedEntries(
  db: Database,
  params: GetPausedTimersParams,
) {
  const { teamId, assignedId } = params;

  const whereConditions = [
    eq(trackerEntries.teamId, teamId),
    isNotNull(trackerEntries.stop),
    isNotNull(trackerEntries.duration),
    gte(trackerEntries.duration, 0), // Paused entries have positive duration
  ];

  if (assignedId) {
    whereConditions.push(eq(trackerEntries.assignedId, assignedId));
  }

  const pausedEntries = await db.query.trackerEntries.findMany({
    where: and(...whereConditions),
    with: {
      trackerProject: {
        columns: { id: true, name: true },
      },
    },
    orderBy: trackerEntries.createdAt,
    limit: 10, // Only show recent paused entries
  });

  return pausedEntries;
}
