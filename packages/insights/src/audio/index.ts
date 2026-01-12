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
