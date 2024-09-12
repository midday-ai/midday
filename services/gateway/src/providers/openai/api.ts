import { ProviderAPIConfig } from '../types';

const OpenAIAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://api.openai.com/v1',
  headers: ({ providerOptions, fn }) => {
    const headersObj: Record<string, string> = {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
    if (providerOptions.openaiOrganization) {
      headersObj['OpenAI-Organization'] = providerOptions.openaiOrganization;
    }

    if (providerOptions.openaiProject) {
      headersObj['OpenAI-Project'] = providerOptions.openaiProject;
    }

    if (fn === 'createTranscription' || fn === 'createTranslation')
      headersObj['Content-Type'] = 'multipart/form-data';

    return headersObj;
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'complete':
        return '/completions';
      case 'chatComplete':
        return '/chat/completions';
      case 'embed':
        return '/embeddings';
      case 'imageGenerate':
        return '/images/generations';
      case 'createSpeech':
        return '/audio/speech';
      case 'createTranscription':
        return '/audio/transcriptions';
      case 'createTranslation':
        return '/audio/translations';
      default:
        return '';
    }
  },
};

export default OpenAIAPIConfig;
