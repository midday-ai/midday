import Providers from '../../providers';

export interface TestVariable {
  apiKey?: string;
  chatCompletions?: {
    model: string;
  };
}

export interface TestVariables {
  [key: keyof typeof Providers]: TestVariable;
}

const testVariables: TestVariables = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    chatCompletions: { model: 'gpt-3.5-turbo' },
  },
  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    chatCompletions: { model: 'command-r-plus' },
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    chatCompletions: {
      model: 'claude-3-opus-20240229',
    },
  },
  'azure-openai': {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    chatCompletions: { model: '' },
  },
  anyscale: {
    apiKey: process.env.ANYSCALE_API_KEY,
    chatCompletions: { model: 'j2-light' },
  },
  palm: {
    apiKey: process.env.PALM_API_KEY,
    chatCompletions: { model: '' },
  },
  'together-ai': {
    apiKey: process.env.TOGETHER_AI_API_KEY,
    chatCompletions: { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    chatCompletions: { model: 'gemini-1.5-flash' },
  },
  'vertex-ai': {
    apiKey: process.env.VERTEX_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  'perplexity-ai': {
    apiKey: process.env.PERPLEXITY_AI_API_KEY,
    chatCompletions: { model: 'llama-3-sonar-small-32k-online' },
  },
  'mistral-ai': {
    apiKey: process.env.MISTRAL_AI_API_KEY,
    chatCompletions: { model: 'open-mistral-nemo' },
  },
  deepinfra: {
    apiKey: process.env.DEEPINFRA_API_KEY,
    chatCompletions: { model: 'meta-llama/Meta-Llama-3-8B-Instruct' },
  },
  'stability-ai': {
    apiKey: process.env.STABILITY_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  nomic: {
    apiKey: process.env.NOMIC_API_KEY,
    chatCompletions: { model: '' },
  },
  ollama: {
    apiKey: process.env.OLLAMA_API_KEY,
    chatCompletions: { model: '' },
  },
  ai21: {
    apiKey: process.env.AI21_API_KEY,
    chatCompletions: {
      model: 'j2-ultra',
    },
  },
  bedrock: {
    apiKey: process.env.BEDROCK_API_KEY,
    chatCompletions: { model: '' },
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    chatCompletions: { model: 'llama3-8b-8192' },
  },
  segmind: {
    apiKey: process.env.SEGMIND_API_KEY,
    chatCompletions: { model: '' },
  },
  jina: {
    apiKey: process.env.JINA_API_KEY,
    chatCompletions: { model: '' },
  },
  'fireworks-ai': {
    apiKey: process.env.FIREWORKS_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  'workers-ai': {
    apiKey: process.env.WORKERS_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  'reka-ai': {
    apiKey: process.env.REKA_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  moonshot: {
    apiKey: process.env.MOONSHOT_API_KEY,
    chatCompletions: { model: '' },
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    chatCompletions: { model: 'meta-llama/llama-3.1-8b-instruct:free' },
  },
  lingyi: {
    apiKey: process.env.LINGYI_API_KEY,
    chatCompletions: { model: '' },
  },
  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY,
    chatCompletions: { model: '' },
  },
  'novita-ai': {
    apiKey: process.env.NOVITA_AI_API_KEY,
    chatCompletions: { model: '' },
  },
  monsterapi: {
    apiKey: process.env.MONSTERAPI_API_KEY,
    chatCompletions: { model: 'meta-llama/Meta-Llama-3-8B-Instruct' },
  },
  predibase: {
    apiKey: process.env.PREDIBASE_API_KEY,
    chatCompletions: { model: '' },
  },
};

export default testVariables;
