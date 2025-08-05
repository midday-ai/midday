import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  activitiesResponseSchema,
  activityResponseSchema,
  getActivitiesSchema,
  updateAllActivitiesStatusResponseSchema,
  updateAllActivitiesStatusSchema,
} from "@api/schemas/activities";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getActivities,
  updateActivityStatus,
  updateAllActivitiesStatus,
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
    path: "/{activityId}/status",
    summary: "Update activity status",
    operationId: "updateActivityStatus",
    "x-speakeasy-name-override": "updateStatus",
    description: "Update the status of a specific activity.",
    tags: ["Activities"],
    request: {
      params: z.object({
        activityId: z
          .string()
          .uuid()
          .openapi({
            description: "The ID of the activity to update",
            example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
            param: {
              in: "path",
            },
          }),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              status: z.enum(["unread", "read", "archived"]).openapi({
                description: "The new status for the activity",
                example: "read",
              }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Activity status updated successfully.",
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
    const { status } = c.req.valid("json");

    const result = await updateActivityStatus(db, activityId, status);

    return c.json(validateResponse({ data: result }, activityResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/update-all-status",
    summary: "Update status of all activities",
    operationId: "updateAllActivitiesStatus",
    "x-speakeasy-name-override": "updateAllStatus",
    description:
      "Update the status of all activities for the authenticated team.",
    tags: ["Activities"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateAllActivitiesStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "All activities status updated successfully.",
        content: {
          "application/json": {
            schema: updateAllActivitiesStatusResponseSchema,
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

    const result = await updateAllActivitiesStatus(db, teamId, body.status, {
      userId: body.userId,
    });

    return c.json(
      validateResponse(
        { data: result },
        updateAllActivitiesStatusResponseSchema,
      ),
    );
  },
);

export { app as activitiesRouter };
