/**
 * Audio module - ElevenLabs TTS and storage utilities
 */

// Generator
export {
  generateAudio,
  generateAudioWithSettings,
  isAudioEnabled,
} from "./generator";

// Script builder
export {
  buildAudioScript,
  buildTeaserScript,
  estimateScriptCharacters,
} from "./script";

// Storage
export {
  audioExists,
  deleteInsightAudio,
  getAudioPath,
  getAudioPresignedUrl,
  uploadInsightAudio,
} from "./storage";

// Reusable audio generation for insights (lazy generation)
export {
  canGenerateAudio,
  generateInsightAudio,
  type AudioGenerationResult,
  type InsightForAudio,
} from "./generate-for-insight";

// Token utilities for public audio access (email links)
export {
  buildAudioUrl,
  createAudioToken,
  isAudioTokenEnabled,
  verifyAudioToken,
  type AudioTokenPayload,
} from "./token";
