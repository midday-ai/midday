import { openai } from "@ai-sdk/openai";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "@midday/logger";
import { experimental_transcribe as transcribe } from "ai";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

const transcriptionRequestSchema = z.object({
  audio: z.string().describe("Base64 encoded audio data"),
  mimeType: z.string().describe("MIME type of the audio file"),
});

app.post("/", withRequiredScope("chat.write"), async (c) => {
  try {
    // Parse and validate the request body
    const body = await c.req.json();
    const validationResult = transcriptionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error }, 400);
    }

    const { audio, mimeType } = validationResult.data;
    const teamId = c.get("teamId");
    const session = c.get("session");
    const userId = session.user.id;

    logger.info("Starting audio transcription", {
      userId,
      teamId,
      mimeType,
      audioLength: audio.length,
    });

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Transcribe the audio
    const result = await transcribe({
      model: openai.transcription("gpt-4o-mini-transcribe"),
      audio: audioBuffer,
    });

    logger.info("Audio transcription completed", {
      userId,
      teamId,
      transcriptLength: result.text.length,
    });

    return c.json({
      success: true,
      text: result.text,
      language: result.language,
      durationInSeconds: result.durationInSeconds,
    });
  } catch (error) {
    logger.error("Transcription failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    return c.json(
      {
        success: false,
        error: "Failed to transcribe audio",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { app as transcriptionRouter };
