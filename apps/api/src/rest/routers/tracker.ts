import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/projects",
  describeRoute({
    description: "Get tracker projects",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "List of tracker projects",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["in_progress", "completed"],
                  },
                  currency: { type: "string" },
                  rate: { type: "number" },
                  estimate: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  }),
);

app.post(
  "/projects",
  describeRoute({
    description: "Create tracker project",
    tags: ["Tracker"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              currency: { type: "string" },
              rate: { type: "number" },
              estimate: { type: "number" },
              status: {
                type: "string",
                enum: ["in_progress", "completed"],
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Tracker project created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                status: { type: "string" },
                currency: { type: "string" },
                rate: { type: "number" },
                estimate: { type: "number" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  }),
);

app.get(
  "/projects/:id",
  describeRoute({
    description: "Get tracker project by ID",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "Tracker project details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                status: { type: "string" },
                currency: { type: "string" },
                rate: { type: "number" },
                estimate: { type: "number" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                totalDuration: { type: "number" },
                totalAmount: { type: "number" },
              },
            },
          },
        },
      },
    },
  }),
);

app.put(
  "/projects/:id",
  describeRoute({
    description: "Update tracker project by ID",
    tags: ["Tracker"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              status: {
                type: "string",
                enum: ["in_progress", "completed"],
              },
              currency: { type: "string" },
              rate: { type: "number" },
              estimate: { type: "number" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tracker project updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                status: { type: "string" },
                currency: { type: "string" },
                rate: { type: "number" },
                estimate: { type: "number" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  }),
);

app.delete(
  "/projects/:id",
  describeRoute({
    description: "Delete tracker project by ID",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "Tracker project deleted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

// Time entries endpoints
app.get(
  "/entries",
  describeRoute({
    description: "Get time entries",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "List of time entries",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  projectId: { type: "string" },
                  description: { type: "string" },
                  date: { type: "string", format: "date" },
                  start: { type: "string", format: "time" },
                  stop: { type: "string", format: "time" },
                  duration: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  }),
);

app.post(
  "/entries",
  describeRoute({
    description: "Create time entry",
    tags: ["Tracker"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["projectId", "date"],
            properties: {
              projectId: { type: "string" },
              description: { type: "string" },
              date: { type: "string", format: "date" },
              start: { type: "string", format: "time" },
              stop: { type: "string", format: "time" },
              duration: { type: "number" },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Time entry created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                projectId: { type: "string" },
                description: { type: "string" },
                date: { type: "string", format: "date" },
                start: { type: "string", format: "time" },
                stop: { type: "string", format: "time" },
                duration: { type: "number" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  }),
);

app.get(
  "/entries/:id",
  describeRoute({
    description: "Get time entry by ID",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "Time entry details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                projectId: { type: "string" },
                description: { type: "string" },
                date: { type: "string", format: "date" },
                start: { type: "string", format: "time" },
                stop: { type: "string", format: "time" },
                duration: { type: "number" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  }),
);

app.put(
  "/entries/:id",
  describeRoute({
    description: "Update time entry by ID",
    tags: ["Tracker"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              date: { type: "string", format: "date" },
              start: { type: "string", format: "time" },
              stop: { type: "string", format: "time" },
              duration: { type: "number" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Time entry updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                projectId: { type: "string" },
                description: { type: "string" },
                date: { type: "string", format: "date" },
                start: { type: "string", format: "time" },
                stop: { type: "string", format: "time" },
                duration: { type: "number" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  }),
);

app.delete(
  "/entries/:id",
  describeRoute({
    description: "Delete time entry by ID",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "Time entry deleted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

// Legacy tracker endpoint for backwards compatibility
app.get(
  "/",
  describeRoute({
    description: "Get tracker overview",
    tags: ["Tracker"],
    responses: {
      200: {
        description: "Tracker overview data",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                activeProjects: { type: "number" },
                totalProjects: { type: "number" },
                totalDuration: { type: "number" },
                totalAmount: { type: "number" },
              },
            },
          },
        },
      },
    },
  }),
);

export const trackerRouter = app;
