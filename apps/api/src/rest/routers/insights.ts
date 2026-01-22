import type { Context } from "@api/rest/types";
import {
  audioUrlResponseSchema,
  insightByIdSchema,
  insightResponseSchema,
  insightsListResponseSchema,
  latestInsightSchema,
  listInsightsSchema,
} from "@api/schemas/insights";
import { createAdminClient } from "@api/services/supabase";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  getInsightById,
  getInsightsForUser,
  getLatestInsight,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const AUDIO_BUCKET = "vault";

const errorResponseSchema = z.object({
  error: z.string(),
});

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List insights",
    operationId: "listInsights",
    "x-speakeasy-name-override": "list",
    description:
      "Retrieve a paginated list of AI-generated business insights for the authenticated team.",
    tags: ["Insights"],
    request: {
      query: listInsightsSchema,
    },
    responses: {
      200: {
        description: "List of insights",
        content: {
          "application/json": {
            schema: insightsListResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("insights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const { limit, cursor, periodType, includeDismissed } =
      c.req.valid("query");

    const result = await getInsightsForUser(db, {
      teamId,
      userId: session.user.id,
      periodType: periodType ?? undefined,
      pageSize: limit ?? 10,
      cursor: cursor ?? null,
      includeDismissed: includeDismissed ?? false,
      status: "completed",
    });

    return c.json(validateResponse(result, insightsListResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/latest",
    summary: "Get latest insight",
    operationId: "getLatestInsight",
    "x-speakeasy-name-override": "latest",
    description:
      "Get the most recent completed insight, optionally filtered by period type.",
    tags: ["Insights"],
    request: {
      query: latestInsightSchema,
    },
    responses: {
      200: {
        description: "The latest insight",
        content: {
          "application/json": {
            schema: insightResponseSchema,
          },
        },
      },
      404: {
        description: "No insights available",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("insights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { periodType } = c.req.valid("query");

    const result = await getLatestInsight(db, {
      teamId,
      periodType: periodType ?? undefined,
    });

    if (!result) {
      return c.json({ error: "No insights available" }, 404);
    }

    return c.json(validateResponse(result, insightResponseSchema), 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Get insight by ID",
    operationId: "getInsightById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a specific insight by its unique identifier.",
    tags: ["Insights"],
    request: {
      params: insightByIdSchema,
    },
    responses: {
      200: {
        description: "The requested insight",
        content: {
          "application/json": {
            schema: insightResponseSchema,
          },
        },
      },
      404: {
        description: "Insight not found",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("insights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getInsightById(db, { id, teamId });

    if (!result) {
      return c.json({ error: "Insight not found" }, 404);
    }

    return c.json(validateResponse(result, insightResponseSchema), 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/audio-url",
    summary: "Get insight audio URL",
    operationId: "getInsightAudioUrl",
    "x-speakeasy-name-override": "getAudioUrl",
    description:
      "Generate a pre-signed URL for the insight's audio file. The URL is valid for 1 hour.",
    tags: ["Insights"],
    request: {
      params: insightByIdSchema,
    },
    responses: {
      200: {
        description: "Pre-signed audio URL",
        content: {
          "application/json": {
            schema: audioUrlResponseSchema,
          },
        },
      },
      404: {
        description: "Insight or audio not found",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      500: {
        description: "Failed to generate audio URL",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("insights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const insight = await getInsightById(db, { id, teamId });

    if (!insight) {
      return c.json({ error: "Insight not found" }, 404);
    }

    if (!insight.audioPath) {
      return c.json({ error: "Audio not available for this insight" }, 404);
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(insight.audioPath, 60 * 60); // 1 hour

    if (error || !data?.signedUrl) {
      return c.json({ error: "Failed to generate audio URL" }, 500);
    }

    return c.json(
      validateResponse(
        {
          audioUrl: data.signedUrl,
          expiresIn: 60 * 60,
        },
        audioUrlResponseSchema,
      ),
      200,
    );
  },
);

export const insightsRouter = app;
