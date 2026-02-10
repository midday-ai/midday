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
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getInsightById,
  getInsightsForUser,
  getLatestInsight,
  updateInsight,
} from "@midday/db/queries";
import {
  canGenerateAudio,
  generateInsightAudio,
  getAudioPresignedUrl,
  isAudioEnabled,
  verifyAudioToken,
} from "@midday/insights/audio";
import { createLoggerWithContext } from "@midday/logger";
import { withRequiredScope } from "../middleware";

const logger = createLoggerWithContext("rest:insights");

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
      "Generate a pre-signed URL for the insight's audio file. Audio is generated on-demand if not already cached. The URL is valid for 1 hour.",
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
        description: "Insight not found or audio generation not available",
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

    const supabase = await createAdminClient();
    let audioPath = insight.audioPath;

    // Lazy generation: generate audio if not already cached
    if (!audioPath) {
      if (!isAudioEnabled()) {
        return c.json({ error: "Audio generation is not configured" }, 404);
      }

      if (!canGenerateAudio(insight)) {
        return c.json({ error: "Audio not available for this insight" }, 404);
      }

      try {
        const result = await generateInsightAudio(supabase, insight);
        audioPath = result.audioPath;

        // Update the insight with the new audio path for future requests
        await updateInsight(db, {
          id: insight.id,
          teamId: insight.teamId,
          audioPath,
        });
      } catch (error) {
        logger.error("Failed to generate audio", {
          error: error instanceof Error ? error.message : String(error),
        });
        return c.json({ error: "Failed to generate audio" }, 500);
      }
    }

    // Generate presigned URL for the audio file
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(audioPath, 60 * 60); // 1 hour

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

// Public audio endpoint for email links (token-based auth)
const audioTokenQuerySchema = z.object({
  token: z.string().min(1).openapi({
    description: "JWT token for audio access",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/audio",
    summary: "Stream insight audio (public with token)",
    operationId: "getInsightAudio",
    "x-speakeasy-name-override": "getAudio",
    description:
      "Access insight audio via a signed token (for email links). Audio is generated on-demand if not cached. Redirects to the audio file.",
    tags: ["Insights"],
    request: {
      params: insightByIdSchema,
      query: audioTokenQuerySchema,
    },
    responses: {
      302: {
        description: "Redirect to audio file",
      },
      400: {
        description: "Invalid or expired token",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      404: {
        description: "Insight not found or audio not available",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      500: {
        description: "Failed to generate audio",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    // No middleware - public endpoint with token auth
  }),
  async (c) => {
    const db = c.get("db");
    const { id } = c.req.valid("param");
    const { token } = c.req.valid("query");

    // Verify the token
    let tokenPayload: { insightId: string; teamId: string };
    try {
      tokenPayload = await verifyAudioToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";
      return c.json({ error: message }, 400);
    }

    // Validate that the token is for this insight
    if (tokenPayload.insightId !== id) {
      return c.json({ error: "Token does not match insight ID" }, 400);
    }

    // Fetch the insight
    const insight = await getInsightById(db, {
      id,
      teamId: tokenPayload.teamId,
    });

    if (!insight) {
      return c.json({ error: "Insight not found" }, 404);
    }

    const supabase = await createAdminClient();
    let audioPath = insight.audioPath;

    // Lazy generation: generate audio if not already cached
    if (!audioPath) {
      if (!isAudioEnabled()) {
        return c.json({ error: "Audio generation is not configured" }, 404);
      }

      if (!canGenerateAudio(insight)) {
        return c.json({ error: "Audio not available for this insight" }, 404);
      }

      try {
        const result = await generateInsightAudio(supabase, insight);
        audioPath = result.audioPath;

        // Update the insight with the new audio path
        await updateInsight(db, {
          id: insight.id,
          teamId: insight.teamId,
          audioPath,
        });
      } catch (error) {
        logger.error("Failed to generate audio", {
          error: error instanceof Error ? error.message : String(error),
        });
        return c.json({ error: "Failed to generate audio" }, 500);
      }
    }

    // Generate presigned URL and redirect
    const presignedUrl = await getAudioPresignedUrl(
      supabase,
      audioPath,
      60 * 60, // 1 hour
    );

    return c.redirect(presignedUrl, 302);
  },
);

export const insightsRouter = app;
