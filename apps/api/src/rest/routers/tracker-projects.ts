import type { Context } from "@api/rest/types";
import {
  deleteTrackerProjectSchema,
  getTrackerProjectByIdSchema,
  getTrackerProjectsSchema,
  trackerProjectResponseSchema,
  trackerProjectsResponseSchema,
  upsertTrackerProjectSchema,
} from "@api/schemas/tracker-projects";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteTrackerProject,
  getTrackerProjectById,
  getTrackerProjects,
  upsertTrackerProject,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all tracker projects",
    operationId: "listTrackerProjects",
    "x-speakeasy-name-override": "list",
    description: "List all tracker projects for the authenticated team.",
    tags: ["Tracker Projects"],
    request: {
      query: getTrackerProjectsSchema,
    },
    responses: {
      200: {
        description: "List all tracker projects for the authenticated team.",
        content: {
          "application/json": {
            schema: trackerProjectsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-projects.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const { cursor, pageSize, sort, ...filter } = c.req.valid("query");

    const result = await getTrackerProjects(db, {
      teamId,
      cursor,
      pageSize,
      ...filter,
      sort,
    });

    return c.json(validateResponse(result, trackerProjectsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create a tracker project",
    operationId: "createTrackerProject",
    "x-speakeasy-name-override": "create",
    description: "Create a tracker project for the authenticated team.",
    tags: ["Tracker Projects"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertTrackerProjectSchema.omit({ id: true }),
            example: {
              name: "New Project",
            },
          },
        },
        description: "Tracker project to create",
      },
    },
    responses: {
      200: {
        description: "Tracker project created successfully.",
        content: {
          "application/json": {
            schema: trackerProjectResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-projects.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const result = await upsertTrackerProject(db, {
      teamId,
      ...c.req.valid("json"),
    });

    return c.json(validateResponse(result, trackerProjectResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a tracker project",
    operationId: "updateTrackerProject",
    "x-speakeasy-name-override": "update",
    description: "Update a tracker project for the authenticated team.",
    tags: ["Tracker Projects"],
    request: {
      params: getTrackerProjectByIdSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: upsertTrackerProjectSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tracker project updated successfully.",
        content: {
          "application/json": {
            schema: trackerProjectResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-projects.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const { id } = c.req.valid("param");

    const result = await upsertTrackerProject(db, {
      teamId,
      id,
      ...c.req.valid("json"),
    });

    return c.json(validateResponse(result, trackerProjectResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a tracker project",
    operationId: "getTrackerProjectById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a tracker project for the authenticated team.",
    tags: ["Tracker Projects"],
    request: {
      params: getTrackerProjectByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Tracker project by ID for the authenticated team.",
        content: {
          "application/json": {
            schema: trackerProjectResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-projects.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const { id } = c.req.valid("param");

    const result = await getTrackerProjectById(db, {
      teamId,
      id,
    });

    return c.json(validateResponse(result, trackerProjectResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a tracker project",
    operationId: "deleteTrackerProject",
    "x-speakeasy-name-override": "delete",
    description: "Delete a tracker project for the authenticated team.",
    tags: ["Tracker Projects"],
    request: {
      params: getTrackerProjectByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Tracker project deleted successfully.",
        content: {
          "application/json": {
            schema: deleteTrackerProjectSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tracker-projects.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const { id } = c.req.valid("param");

    const result = await deleteTrackerProject(db, {
      teamId,
      id,
    });

    return c.json(validateResponse(result, deleteTrackerProjectSchema));
  },
);

export const trackerProjectsRouter = app;
