import { endpointStrings } from './providers/types';

export const POWERED_BY: string = 'portkey';

export const HEADER_KEYS: Record<string, string> = {
  MODE: `x-${POWERED_BY}-mode`,
  RETRIES: `x-${POWERED_BY}-retry-count`,
  PROVIDER: `x-${POWERED_BY}-provider`,
  TRACE_ID: `x-${POWERED_BY}-trace-id`,
  CACHE: `x-${POWERED_BY}-cache`,
  METADATA: `x-${POWERED_BY}-metadata`,
  FORWARD_HEADERS: `x-${POWERED_BY}-forward-headers`,
  CUSTOM_HOST: `x-${POWERED_BY}-custom-host`,
  REQUEST_TIMEOUT: `x-${POWERED_BY}-request-timeout`,
  STRICT_OPEN_AI_COMPLIANCE: `x-${POWERED_BY}-strict-open-ai-compliance`,
};

export const RESPONSE_HEADER_KEYS: Record<string, string> = {
  RETRY_ATTEMPT_COUNT: `x-${POWERED_BY}-retry-attempt-count`,
  LAST_USED_OPTION_INDEX: `x-${POWERED_BY}-last-used-option-index`,
  LAST_USED_OPTION_PARAMS: `x-${POWERED_BY}-last-used-option-params`,
  CACHE_STATUS: `x-${POWERED_BY}-cache-status`,
  TRACE_ID: `x-${POWERED_BY}-trace-id`,
};

export const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];
export const MAX_RETRIES = 5;
export const REQUEST_TIMEOUT_STATUS_CODE = 408;
export const PRECONDITION_CHECK_FAILED_STATUS_CODE = 412;

export const OPEN_AI: string = 'openai';
export const COHERE: string = 'cohere';
export const AZURE_OPEN_AI: string = 'azure-openai';
export const AZURE_AI_INFERENCE: string = 'azure-ai';
export const ANTHROPIC: string = 'anthropic';
export const ANYSCALE: string = 'anyscale';
export const PALM: string = 'palm';
export const TOGETHER_AI: string = 'together-ai';
export const GOOGLE: string = 'google';
export const GOOGLE_VERTEX_AI: string = 'vertex-ai';
export const HUGGING_FACE: string = 'huggingface';
export const PERPLEXITY_AI: string = 'perplexity-ai';
export const REKA_AI: string = 'reka-ai';
export const MISTRAL_AI: string = 'mistral-ai';
export const DEEPINFRA: string = 'deepinfra';
export const STABILITY_AI: string = 'stability-ai';
export const NOMIC: string = 'nomic';
export const OLLAMA: string = 'ollama';
export const AI21: string = 'ai21';
export const BEDROCK: string = 'bedrock';
export const GROQ: string = 'groq';
export const SEGMIND: string = 'segmind';
export const JINA: string = 'jina';
export const FIREWORKS_AI: string = 'fireworks-ai';
export const WORKERS_AI: string = 'workers-ai';
export const MOONSHOT: string = 'moonshot';
export const OPENROUTER: string = 'openrouter';
export const LINGYI: string = 'lingyi';
export const ZHIPU: string = 'zhipu';
export const NOVITA_AI: string = 'novita-ai';
export const MONSTERAPI: string = 'monsterapi';
export const DEEPSEEK: string = 'deepseek';
export const PREDIBASE: string = 'predibase';
export const TRITON: string = 'triton';
export const VOYAGE: string = 'voyage';
export const GITHUB: string = 'github';
export const DEEPBRICKS: string = 'deepbricks';
export const SILICONFLOW: string = 'siliconflow';
export const CEREBRAS: string = 'cerebras';

export const VALID_PROVIDERS = [
  ANTHROPIC,
  ANYSCALE,
  AZURE_OPEN_AI,
  COHERE,
  GOOGLE,
  GOOGLE_VERTEX_AI,
  MISTRAL_AI,
  OPEN_AI,
  PALM,
  PERPLEXITY_AI,
  REKA_AI,
  TOGETHER_AI,
  DEEPINFRA,
  STABILITY_AI,
  NOMIC,
  OLLAMA,
  AI21,
  BEDROCK,
  GROQ,
  SEGMIND,
  JINA,
  FIREWORKS_AI,
  WORKERS_AI,
  MOONSHOT,
  OPENROUTER,
  LINGYI,
  ZHIPU,
  NOVITA_AI,
  MONSTERAPI,
  DEEPSEEK,
  PREDIBASE,
  TRITON,
  VOYAGE,
  AZURE_AI_INFERENCE,
  GITHUB,
  DEEPBRICKS,
  SILICONFLOW,
  HUGGING_FACE,
  CEREBRAS,
];

export const CONTENT_TYPES = {
  APPLICATION_JSON: 'application/json',
  MULTIPART_FORM_DATA: 'multipart/form-data',
  EVENT_STREAM: 'text/event-stream',
  AUDIO_MPEG: 'audio/mpeg',
  APPLICATION_OCTET_STREAM: 'application/octet-stream',
  GENERIC_AUDIO_PATTERN: 'audio',
  PLAIN_TEXT: 'text/plain',
  HTML: 'text/html',
  GENERIC_IMAGE_PATTERN: 'image/',
};

export const MULTIPART_FORM_DATA_ENDPOINTS: endpointStrings[] = [
  'createTranscription',
  'createTranslation',
];
