import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  getNotificationsSchema,
  notificationResponseSchema,
  notificationsResponseSchema,
  updateAllNotificationsStatusResponseSchema,
  updateAllNotificationsStatusSchema,
} from "@api/schemas/notifications";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
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
    summary: "List all notifications",
    operationId: "listNotifications",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of notifications for the authenticated team.",
    tags: ["Notifications"],
    request: {
      query: getNotificationsSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of notifications for the authenticated team.",
        content: {
          "application/json": {
            schema: notificationsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("notifications.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const query = c.req.valid("query");

    const result = await getActivities(db, {
      teamId,
      ...query,
    });

    return c.json(validateResponse(result, notificationsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{notificationId}/status",
    summary: "Update notification status",
    operationId: "updateNotificationStatus",
    "x-speakeasy-name-override": "updateStatus",
    description: "Update the status of a specific notification.",
    tags: ["Notifications"],
    request: {
      params: z.object({
        notificationId: z
          .string()
          .uuid()
          .openapi({
            description: "The ID of the notification to update",
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
                description: "The new status for the notification",
                example: "read",
              }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Notification status updated successfully.",
        content: {
          "application/json": {
            schema: notificationResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("notifications.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { notificationId } = c.req.valid("param");
    const { status } = c.req.valid("json");

    const result = await updateActivityStatus(
      db,
      notificationId,
      status,
      teamId,
    );

    return c.json(
      validateResponse({ data: result }, notificationResponseSchema),
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/update-all-status",
    summary: "Update status of all notifications",
    operationId: "updateAllNotificationsStatus",
    "x-speakeasy-name-override": "updateAllStatus",
    description:
      "Update the status of all notifications for the authenticated team.",
    tags: ["Notifications"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateAllNotificationsStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "All notifications status updated successfully.",
        content: {
          "application/json": {
            schema: updateAllNotificationsStatusResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("notifications.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const body = c.req.valid("json");

    const result = await updateAllActivitiesStatus(db, teamId, body.status, {
      userId: session.user.id,
    });

    return c.json(
      validateResponse(
        { data: result },
        updateAllNotificationsStatusResponseSchema,
      ),
    );
  },
);

export { app as notificationsRouter };
