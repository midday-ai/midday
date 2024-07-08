"use server";

import OpenAI from "openai";

const openai = new OpenAI({});

export async function getTranscript(formData: FormData) {
  try {
    const { text } = await openai.audio.transcriptions.create({
      file: formData.get("input"),
      model: "whisper-1",
      language: "en",
    });

    return text.trim() || null;
  } catch {
    return null; // Empty audio file
  }
}
