/**
 * Audio module - ElevenLabs TTS and storage utilities
 */

// Reusable audio generation for insights (lazy generation)
export {
  type AudioGenerationResult,
  canGenerateAudio,
  generateInsightAudio,
  type InsightForAudio,
} from "./generate-for-insight";
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

// Token utilities for public audio access (email links)
export {
  type AudioTokenPayload,
  buildAudioUrl,
  createAudioToken,
  isAudioTokenEnabled,
  verifyAudioToken,
} from "./token";
