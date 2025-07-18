import {
  bulkCreateTrackerEntries,
  deleteTrackerEntry,
  getCurrentTimer,
  getPausedEntries,
  getTimerStatus,
  getTrackerRecordsByRange,
  pauseTimer,
  startTimer,
  stopTimer,
  upsertTrackerEntries,
} from "@api/db/queries/tracker-entries";
import type { Context } from "@api/rest/types";
import {
  bulkCreateTrackerEntriesSchema,
  createTrackerEntriesResponseSchema,
  deleteTrackerEntrySchema,
  getCurrentTimerSchema,
  getTrackerRecordsByRangeSchema,
  pauseTimerSchema,
  pausedEntriesSchema,
  startTimerSchema,
  stopTimerSchema,
  timerResponseSchema,
  timerStatusSchema,
  trackerEntriesResponseSchema,
  upsertTrackerEntriesSchema,
} from "@api/schemas/tracker-entries";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all tracker entries",
    operationId: "listTrackerEntries",
    "x-speakeasy-name-override": "list",
    description: "List all tracker entries for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      query: getTrackerRecordsByRangeSchema,
    },
    responses: {
      200: {
        description: "List all tracker entries for the authenticated team.",
        content: {
          "application/json": {
            schema: trackerEntriesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const result = await getTrackerRecordsByRange(db, {
      teamId,
      ...c.req.valid("query"),
    });

    return c.json(validateResponse(result, trackerEntriesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create a tracker entry",
    operationId: "createTrackerEntry",
    "x-speakeasy-name-override": "create",
    description: "Create a tracker entry for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertTrackerEntriesSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Tracker entry created successfully.",
        content: {
          "application/json": {
            schema: createTrackerEntriesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { assignedId, ...rest } = c.req.valid("json");

    const result = await upsertTrackerEntries(db, {
      teamId,
      assignedId: assignedId ?? session.user.id,
      ...rest,
    });

    // Map trackerProject to project to match the response schema
    const dataWithProject = result.map((item) => ({
      ...item,
      project: item.trackerProject,
    }));

    return c.json(
      validateResponse(
        { data: dataWithProject },
        createTrackerEntriesResponseSchema,
      ),
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/bulk",
    summary: "Create multiple tracker entries",
    operationId: "createTrackerEntriesBulk",
    "x-speakeasy-name-override": "createBulk",
    description:
      "Create multiple tracker entries in a single request for efficient data migration.",
    tags: ["Tracker Entries"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: bulkCreateTrackerEntriesSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Tracker entries created successfully.",
        content: {
          "application/json": {
            schema: createTrackerEntriesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { entries } = c.req.valid("json");

    const result = await bulkCreateTrackerEntries(db, {
      teamId,
      entries: entries.map(({ assignedId, ...rest }) => ({
        assignedId: assignedId ?? session.user.id,
        ...rest,
      })),
    });

    const dataWithProject = result.map((item) => ({
      ...item,
      project: item.trackerProject,
    }));

    return c.json(
      validateResponse(
        { data: dataWithProject },
        createTrackerEntriesResponseSchema,
      ),
    );
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a tracker entry",
    operationId: "updateTrackerEntry",
    "x-speakeasy-name-override": "update",
    description: "Update a tracker entry for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      params: deleteTrackerEntrySchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: upsertTrackerEntriesSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tracker entry updated successfully.",
        content: {
          "application/json": {
            schema: createTrackerEntriesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");
    const { assignedId, ...rest } = c.req.valid("json");

    const result = await upsertTrackerEntries(db, {
      id,
      teamId,
      ...rest,
      ...(assignedId !== undefined && { assignedId }),
    });

    // Map trackerProject to project to match the response schema
    const dataWithProject = result.map((item) => ({
      ...item,
      project: item.trackerProject,
    }));

    return c.json(
      validateResponse(
        { data: dataWithProject },
        createTrackerEntriesResponseSchema,
      ),
    );
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a tracker entry",
    operationId: "deleteTrackerEntry",
    "x-speakeasy-name-override": "delete",
    description: "Delete a tracker entry for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      params: deleteTrackerEntrySchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Tracker entry deleted successfully.",
        content: {
          "application/json": {
            schema: deleteTrackerEntrySchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteTrackerEntry(db, { teamId, id });

    return c.json(validateResponse(result, deleteTrackerEntrySchema));
  },
);

// Timer endpoints (improved naming and structure)
app.openapi(
  createRoute({
    method: "post",
    path: "/start",
    summary: "Start timer",
    operationId: "startTimer",
    "x-speakeasy-name-override": "start",
    description: "Start a new timer session for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: startTimerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Timer started successfully.",
        content: {
          "application/json": {
            schema: timerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { assignedId, ...rest } = c.req.valid("json");

    const result = await startTimer(db, {
      ...rest,
      teamId,
      assignedId: assignedId ?? session.user.id,
    });

    return c.json(validateResponse(result, timerResponseSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/stop",
    summary: "Stop timer",
    operationId: "stopTimer",
    "x-speakeasy-name-override": "stop",
    description: "Stop the current timer session for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: stopTimerSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Timer stopped successfully.",
        content: {
          "application/json": {
            schema: timerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { assignedId, ...rest } = c.req.valid("json");

    const result = await stopTimer(db, {
      ...rest,
      teamId,
      assignedId: assignedId ?? session.user.id,
    });

    return c.json(validateResponse(result, timerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/pause",
    summary: "Pause timer",
    operationId: "pauseTimer",
    "x-speakeasy-name-override": "pause",
    description: "Pause the current timer session for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: pauseTimerSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Timer paused successfully.",
        content: {
          "application/json": {
            schema: timerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { assignedId, ...rest } = c.req.valid("json");

    const result = await pauseTimer(db, {
      ...rest,
      teamId,
      assignedId: assignedId ?? session.user.id,
    });

    return c.json(validateResponse(result, timerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/current",
    summary: "Get current timer",
    operationId: "getCurrentTimer",
    "x-speakeasy-name-override": "getCurrent",
    description: "Get the current timer session for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      query: getCurrentTimerSchema,
    },
    responses: {
      200: {
        description: "Current timer session retrieved successfully.",
        content: {
          "application/json": {
            schema: timerResponseSchema.nullable(),
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const query = c.req.valid("query");

    const assignedId = query.assignedId ?? session.user.id;
    const result = await getCurrentTimer(db, {
      teamId,
      assignedId,
    });

    return c.json(
      result ? validateResponse(result, timerResponseSchema) : null,
    );
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/status",
    summary: "Get timer status",
    operationId: "getTimerStatus",
    "x-speakeasy-name-override": "getStatus",
    description: "Get the timer status for the authenticated team.",
    tags: ["Tracker Entries"],
    request: {
      query: getCurrentTimerSchema,
    },
    responses: {
      200: {
        description: "Timer status retrieved successfully.",
        content: {
          "application/json": {
            schema: timerStatusSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const query = c.req.valid("query");

    const assignedId = query.assignedId ?? session.user.id;
    const result = await getTimerStatus(db, {
      teamId,
      assignedId,
    });

    return c.json(validateResponse(result, timerStatusSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/paused",
    summary: "Get paused entries",
    operationId: "getPausedEntries",
    "x-speakeasy-name-override": "getPaused",
    description: "Get paused timer entries that can be resumed.",
    tags: ["Tracker Entries"],
    request: {
      query: getCurrentTimerSchema,
    },
    responses: {
      200: {
        description: "Paused entries retrieved successfully.",
        content: {
          "application/json": {
            schema: pausedEntriesSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-entries.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const query = c.req.valid("query");

    const assignedId = query.assignedId ?? session.user.id;
    const result = await getPausedEntries(db, {
      teamId,
      assignedId,
    });

    return c.json(validateResponse(result, pausedEntriesSchema));
  },
);

export const trackerEntriesRouter = app;
