import { z } from 'zod';
import {
  OLLAMA,
  VALID_PROVIDERS,
  GOOGLE_VERTEX_AI,
  TRITON,
} from '../../../globals';

export const configSchema: any = z
  .object({
    strategy: z
      .object({
        mode: z
          .string()
          .refine(
            (value) =>
              ['single', 'loadbalance', 'fallback', 'conditional'].includes(
                value
              ),
            {
              message:
                "Invalid 'mode' value. Must be one of: single, loadbalance, fallback, conditional",
            }
          ),
        on_status_codes: z.array(z.number()).optional(),
        conditions: z
          .array(
            z.object({
              query: z.object({}),
              then: z.string(),
            })
          )
          .optional(),
        default: z.string().optional(),
      })
      .optional(),
    provider: z
      .string()
      .refine((value) => VALID_PROVIDERS.includes(value), {
        message: `Invalid 'provider' value. Must be one of: ${VALID_PROVIDERS.join(
          ', '
        )}`,
      })
      .optional(),
    api_key: z.string().optional(),
    aws_secret_access_key: z.string().optional(),
    aws_access_key_id: z.string().optional(),
    aws_session_token: z.string().optional(),
    aws_region: z.string().optional(),
    cache: z
      .object({
        mode: z
          .string()
          .refine((value) => ['simple', 'semantic'].includes(value), {
            message:
              "Invalid 'cache.mode' value. Must be one of: simple, semantic",
          }),
        max_age: z.number().optional(),
      })
      .refine((value) => value.mode !== undefined, {
        message: "'cache.mode' must be defined",
      })
      .optional(),
    retry: z
      .object({
        attempts: z.number(),
        on_status_codes: z.array(z.number()).optional(),
      })
      .refine((value) => value.attempts !== undefined, {
        message: "'retry.attempts' must be defined",
      })
      .optional(),
    weight: z.number().optional(),
    on_status_codes: z.array(z.number()).optional(),
    targets: z.array(z.lazy(() => configSchema)).optional(),
    request_timeout: z.number().optional(),
    custom_host: z.string().optional(),
    forward_headers: z.array(z.string()).optional(),
    // Google Vertex AI specific
    vertex_project_id: z.string().optional(),
    vertex_region: z.string().optional(),
    after_request_hooks: z.any().optional(),
    before_request_hooks: z.any().optional(),
    vertex_service_account_json: z.object({}).catchall(z.string()).optional(),
    // OpenAI specific
    openai_project: z.string().optional(),
    openai_organization: z.string().optional(),
    // AzureOpenAI specific
    azure_model_name: z.string().optional(),
    strict_open_ai_compliance: z.boolean().optional(),
  })
  .refine(
    (value) => {
      const hasProviderApiKey =
        value.provider !== undefined && value.api_key !== undefined;
      const hasModeTargets =
        value.strategy !== undefined && value.targets !== undefined;
      const isOllamaProvider = value.provider === OLLAMA;
      const isTritonProvider = value.provider === TRITON;
      const isVertexAIProvider =
        value.provider === GOOGLE_VERTEX_AI &&
        value.vertex_region &&
        (value.vertex_service_account_json || value.vertex_project_id);
      const hasAWSDetails =
        value.aws_access_key_id && value.aws_secret_access_key;

      return (
        hasProviderApiKey ||
        hasModeTargets ||
        value.cache ||
        value.retry ||
        value.request_timeout ||
        isOllamaProvider ||
        isTritonProvider ||
        hasAWSDetails ||
        isVertexAIProvider ||
        value.after_request_hooks ||
        value.before_request_hooks
      );
    },
    {
      message:
        "Invalid configuration. It must have either 'provider' and 'api_key', or 'strategy' and 'targets', or 'cache', or 'retry', or 'request_timeout'",
    }
  )
  .refine(
    (value) => {
      const customHost = value.custom_host;
      if (customHost && customHost.indexOf('api.portkey') > -1) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid custom host',
    }
  )
  // Validate Google Vertex AI specific fields
  .refine(
    (value) => {
      const isGoogleVertexAIProvider = value.provider === GOOGLE_VERTEX_AI;
      const hasGoogleVertexAIFields =
        (value.vertex_project_id && value.vertex_region) ||
        (value.vertex_region && value.vertex_service_account_json);
      return !(isGoogleVertexAIProvider && !hasGoogleVertexAIFields);
    },
    {
      message: `Invalid configuration. ('vertex_project_id' and 'vertex_region') or ('vertex_service_account_json' and 'vertex_region') are required for '${GOOGLE_VERTEX_AI}' provider. Example: { 'provider': 'vertex-ai', 'vertex_project_id': 'my-project-id', 'vertex_region': 'us-central1', api_key: 'ya29...' }`,
    }
  );
