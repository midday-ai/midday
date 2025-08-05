import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  activitiesResponseSchema,
  activityResponseSchema,
  getActivitiesSchema,
  markActivityAsReadSchema,
  markAllActivitiesAsReadResponseSchema,
  markAllActivitiesAsReadSchema,
} from "@api/schemas/activities";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getActivities,
  markActivityAsRead,
  markAllActivitiesAsRead,
} from "@midday/db/queries";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all activities",
    operationId: "listActivities",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of activities for the authenticated team.",
    tags: ["Activities"],
    request: {
      query: getActivitiesSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of activities for the authenticated team.",
        content: {
          "application/json": {
            schema: activitiesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("activities.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const query = c.req.valid("query");

    const result = await getActivities(db, {
      teamId,
      ...query,
    });

    return c.json(validateResponse(result, activitiesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{activityId}/read",
    summary: "Mark activity as read",
    operationId: "markActivityAsRead",
    "x-speakeasy-name-override": "markAsRead",
    description: "Mark a specific activity as read.",
    tags: ["Activities"],
    request: {
      params: z.object({
        activityId: z
          .string()
          .uuid()
          .openapi({
            description: "The ID of the activity to mark as read",
            example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
            param: {
              in: "path",
            },
          }),
      }),
    },
    responses: {
      200: {
        description: "Activity marked as read successfully.",
        content: {
          "application/json": {
            schema: activityResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("activities.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const { activityId } = c.req.valid("param");

    const result = await markActivityAsRead(db, activityId);

    return c.json(validateResponse({ data: result }, activityResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/mark-all-read",
    summary: "Mark all activities as read",
    operationId: "markAllActivitiesAsRead",
    "x-speakeasy-name-override": "markAllAsRead",
    description: "Mark all activities as read for the authenticated team.",
    tags: ["Activities"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: markAllActivitiesAsReadSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "All activities marked as read successfully.",
        content: {
          "application/json": {
            schema: markAllActivitiesAsReadResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("activities.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");

    const result = await markAllActivitiesAsRead(db, teamId, body);

    return c.json(
      validateResponse({ data: result }, markAllActivitiesAsReadResponseSchema),
    );
  },
);

export { app as activitiesRouter };
