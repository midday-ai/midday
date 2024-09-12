import { ProviderConfigs } from '../types';
import {
  OpenAICompleteConfig,
  OpenAICompleteResponseTransform,
} from './complete';
import { OpenAIEmbedConfig, OpenAIEmbedResponseTransform } from './embed';
import OpenAIAPIConfig from './api';
import {
  OpenAIChatCompleteConfig,
  OpenAIChatCompleteResponseTransform,
} from './chatComplete';
import {
  OpenAIImageGenerateConfig,
  OpenAIImageGenerateResponseTransform,
} from './imageGenerate';
import {
  OpenAICreateSpeechConfig,
  OpenAICreateSpeechResponseTransform,
} from './createSpeech';
import { OpenAICreateTranscriptionResponseTransform } from './createTranscription';
import { OpenAICreateTranslationResponseTransform } from './createTranslation';

const OpenAIConfig: ProviderConfigs = {
  complete: OpenAICompleteConfig,
  embed: OpenAIEmbedConfig,
  api: OpenAIAPIConfig,
  chatComplete: OpenAIChatCompleteConfig,
  imageGenerate: OpenAIImageGenerateConfig,
  createSpeech: OpenAICreateSpeechConfig,
  createTranscription: {},
  createTranslation: {},
  responseTransforms: {
    complete: OpenAICompleteResponseTransform,
    // 'stream-complete': OpenAICompleteResponseTransform,
    chatComplete: OpenAIChatCompleteResponseTransform,
    // 'stream-chatComplete': OpenAIChatCompleteResponseTransform,
    embed: OpenAIEmbedResponseTransform,
    imageGenerate: OpenAIImageGenerateResponseTransform,
    createSpeech: OpenAICreateSpeechResponseTransform,
    createTranscription: OpenAICreateTranscriptionResponseTransform,
    createTranslation: OpenAICreateTranslationResponseTransform,
  },
};

export default OpenAIConfig;
