/**
 * ElevenLabs TTS audio generation for insights
 *
 * Uses Eleven v3 model for:
 * - 70+ language support (vs 29 in multilingual_v2)
 * - Better pronunciation of non-English text
 * - Audio tags support for expressiveness (optional)
 *
 * Note: Currency abbreviations (kr, SEK) should be normalized
 * to full words in the script for better pronunciation.
 * See normalizeForSpeech() in script.ts
 *
 * Voice recommendations:
 * - Browse: https://elevenlabs.io/voice-library
 * - Look for voices with "multilingual" or specific language tags
 * - Test pronunciation with sample text containing your currency
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
 * Default voice ID - can be overridden via ELEVENLABS_VOICE_ID env var
 *
 * Recommended voices for multilingual content:
 * - "Rachel" (21m00Tcm4TlvDq8ikWAM) - Clear, professional
 * - "Adam" (pNInz6obpgDQGcFmaJgB) - Warm, natural
 * - Browse multilingual voices: https://elevenlabs.io/voice-library/multilingual
 */
const DEFAULT_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";

/**
 * Using eleven_v3 for better language support (70+ languages)
 * vs eleven_multilingual_v2 which supports 29 languages
 */
const DEFAULT_MODEL_ID = "eleven_v3";

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
 * Generate audio from a script using ElevenLabs
 *
 * @param script - Text to convert to speech
 * @returns Buffer containing MP3 audio data
 */
export async function generateAudio(script: string): Promise<Buffer> {
  const client = getElevenLabsClient();
  const voiceId = getVoiceId();

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: script,
    modelId: DEFAULT_MODEL_ID,
    outputFormat: "mp3_44100_128",
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
  const modelId = options.modelId || DEFAULT_MODEL_ID;
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
