import type { Context } from "@api/rest/types";
import {
  bulkCreateTrackerEntriesSchema,
  createTrackerEntriesResponseSchema,
  deleteTrackerEntrySchema,
  getCurrentTimerResponseSchema,
  getCurrentTimerSchema,
  getTimerStatusResponseSchema,
  getTrackerRecordsByRangeSchema,
  startTimerResponseSchema,
  startTimerSchema,
  stopTimerResponseSchema,
  stopTimerSchema,
  trackerEntriesResponseSchema,
  upsertTrackerEntriesSchema,
} from "@api/schemas/tracker-entries";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  bulkCreateTrackerEntries,
  deleteTrackerEntry,
  getCurrentTimer,
  getTimerStatus,
  getTrackerRecordsByRange,
  startTimer,
  stopTimer,
  upsertTrackerEntries,
} from "@midday/db/queries";
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

// Timer endpoints
app.openapi(
  createRoute({
    method: "post",
    path: "/timer/start",
    summary: "Start a timer",
    operationId: "startTimer",
    "x-speakeasy-name-override": "startTimer",
    description: "Start a new timer or continue from a paused entry.",
    tags: ["Tracker Timer"],
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
            schema: startTimerResponseSchema,
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
      teamId,
      assignedId: assignedId ?? session.user.id,
      ...rest,
    });

    return c.json(
      validateResponse({ data: result }, startTimerResponseSchema),
      201,
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/timer/stop",
    summary: "Stop a timer",
    operationId: "stopTimer",
    "x-speakeasy-name-override": "stopTimer",
    description: "Stop the current running timer or a specific timer entry.",
    tags: ["Tracker Timer"],
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
            schema: stopTimerResponseSchema,
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
      teamId,
      assignedId: assignedId ?? session.user.id,
      ...rest,
    });

    return c.json(validateResponse({ data: result }, stopTimerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/timer/current",
    summary: "Get current timer",
    operationId: "getCurrentTimer",
    "x-speakeasy-name-override": "getCurrentTimer",
    description: "Get the currently running timer for the authenticated user.",
    tags: ["Tracker Timer"],
    request: {
      query: getCurrentTimerSchema,
    },
    responses: {
      200: {
        description: "Current timer retrieved successfully.",
        content: {
          "application/json": {
            schema: getCurrentTimerResponseSchema,
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
    const { assignedId } = c.req.valid("query");

    const result = await getCurrentTimer(db, {
      teamId,
      assignedId: assignedId ?? session.user.id,
    });

    return c.json(
      validateResponse({ data: result }, getCurrentTimerResponseSchema),
    );
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/timer/status",
    summary: "Get timer status",
    operationId: "getTimerStatus",
    "x-speakeasy-name-override": "getTimerStatus",
    description:
      "Get timer status including elapsed time for the authenticated user.",
    tags: ["Tracker Timer"],
    request: {
      query: getCurrentTimerSchema,
    },
    responses: {
      200: {
        description: "Timer status retrieved successfully.",
        content: {
          "application/json": {
            schema: getTimerStatusResponseSchema,
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
    const { assignedId } = c.req.valid("query");

    const result = await getTimerStatus(db, {
      teamId,
      assignedId: assignedId ?? session.user.id,
    });

    return c.json(
      validateResponse({ data: result }, getTimerStatusResponseSchema),
    );
  },
);

export const trackerEntriesRouter = app;
