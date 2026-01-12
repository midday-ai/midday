/**
 * ElevenLabs TTS audio generation for insights
 * Uses Eleven v3 model with audio tags for expressive narration
 */
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Lazy initialization to avoid requiring API key at import time
let elevenlabsClient: ElevenLabsClient | null = null;

function getElevenLabsClient(): ElevenLabsClient {
  if (!elevenlabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable is not set");
    }
    elevenlabsClient = new ElevenLabsClient({ apiKey });
  }
  return elevenlabsClient;
}

/**
 * Default voice ID for Eleven v3
 * Can be overridden via ELEVENLABS_VOICE_ID env var
 * See available voices at: https://elevenlabs.io/voice-library
 */
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // Default v3 voice

function getVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
}

/**
 * Check if audio generation is enabled (API key is set)
 */
export function isAudioEnabled(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

/**
 * Generate audio from a script using ElevenLabs v3
 * The script can include v3 audio tags like [warmly], [upbeat], [clearly], [pause]
 *
 * @param script - Text to convert to speech (can include audio tags)
 * @returns Buffer containing MP3 audio data
 */
export async function generateAudio(script: string): Promise<Buffer> {
  const client = getElevenLabsClient();
  const voiceId = getVoiceId();

  // Use convert() for full audio buffer (not streaming)
  // v2.x uses camelCase for parameters
  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: script,
    modelId: "eleven_v3", // Use v3 for audio tag support
    outputFormat: "mp3_44100_128", // High quality MP3
  });

  // ReadableStream to Buffer conversion
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

/**
 * Generate audio with custom settings
 */
export async function generateAudioWithSettings(
  script: string,
  options: {
    voiceId?: string;
    modelId?: string;
    outputFormat?: "mp3_44100_128" | "mp3_22050_32" | "pcm_16000" | "pcm_22050";
  } = {},
): Promise<Buffer> {
  const client = getElevenLabsClient();
  const voiceId = options.voiceId || getVoiceId();
  const modelId = options.modelId || "eleven_v3";
  const outputFormat = options.outputFormat || "mp3_44100_128";

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: script,
    modelId,
    outputFormat,
  });

  // ReadableStream to Buffer conversion
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}
