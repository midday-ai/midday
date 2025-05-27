import type { Database } from "@api/db";
import { trackerEntries } from "@api/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";

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
