/**
 * Eval for audio script quality
 *
 * Tests that generated audio scripts are professional, accurate, and well-paced
 */
import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { evalite } from "evalite";
import { buildAudioPrompt } from "../src/content/prompts/index";
import type { InsightSlots } from "../src/content/prompts/slots";
import { audioScorers } from "./audio-scorers";
import { allFixtures } from "./fixtures";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = "gpt-4.1-mini";

/**
 * Generate an audio script from slots
 */
async function generateAudioScript(slots: InsightSlots): Promise<string> {
  const prompt = buildAudioPrompt(slots);

  const result = await generateText({
    model: openai(MODEL),
    prompt,
    temperature: 0.5,
  });

  // Clean up any accidental formatting
  return result.text
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ");
}

evalite("Audio Script Quality", {
  data: allFixtures.map((f) => ({
    input: f.slots,
    name: f.name,
  })),

  task: async (slots) => {
    return generateAudioScript(slots);
  },

  scorers: audioScorers,
});
