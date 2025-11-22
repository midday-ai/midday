import { openai } from "@ai-sdk/openai";
import { getSession } from "@midday/supabase/cached-queries";
import { streamObject } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { vaultFilterSchema } from "./schema";

export const maxDuration = 30;

const requestSchema = z.object({
  input: z.string().min(1),
  context: z.string().optional(),
  currentDate: z.string().optional(),
  timezone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validation.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { input: prompt, context, currentDate, timezone } = validation.data;

    const dateForPrompt = currentDate || new Date().toISOString().split("T")[0];
    const timezoneInfo = timezone ? `Timezone: ${timezone}` : "";

    const result = streamObject({
      model: openai("gpt-4o-mini"),
      mode: "json",
      system: `You are a helpful assistant that generates filters for a given prompt. \n
               Current date is: ${dateForPrompt} \n
               ${timezoneInfo} \n
               ${context || ""}
      `,
      schema: vaultFilterSchema,
      prompt,
      temperature: 0.1,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error generating vault filters:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate filters" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
