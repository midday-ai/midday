import {
  deleteTrackerProject,
  getTrackerProjectById,
  getTrackerProjects,
  upsertTrackerProject,
} from "@api/db/queries/tracker-projects";
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

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all tracker projects",
    description: "List all tracker projects for the authenticated team.",
    tags: ["Tracker"],
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
  }),

  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const { cursor, pageSize, sort, ...filter } = c.req.valid("query");

    const result = await getTrackerProjects(db, {
      teamId,
      cursor,
      pageSize,
      filter,
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
    description: "Create a tracker project for the authenticated team.",
    tags: ["Tracker"],
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
    description: "Update a tracker project for the authenticated team.",
    tags: ["Tracker"],
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
    description: "Retrieve a tracker project for the authenticated team.",
    tags: ["Tracker"],
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
    description: "Delete a tracker project for the authenticated team.",
    tags: ["Tracker"],
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
