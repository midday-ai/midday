import { Context } from 'hono';
import {
  AZURE_OPEN_AI,
  BEDROCK,
  WORKERS_AI,
  HEADER_KEYS,
  POWERED_BY,
  RESPONSE_HEADER_KEYS,
  RETRY_STATUS_CODES,
  GOOGLE_VERTEX_AI,
  OPEN_AI,
  AZURE_AI_INFERENCE,
  ANTHROPIC,
  MULTIPART_FORM_DATA_ENDPOINTS,
  CONTENT_TYPES,
  HUGGING_FACE,
} from '../globals';
import Providers from '../providers';
import { ProviderAPIConfig, endpointStrings } from '../providers/types';
import transformToProviderRequest from '../services/transformToProviderRequest';
import {
  Config,
  Options,
  Params,
  ShortConfig,
  StrategyModes,
  Targets,
} from '../types/requestBody';
import { convertKeysToCamelCase } from '../utils';
import { retryRequest } from './retryHandler';
import { env, getRuntimeKey } from 'hono/adapter';
import { afterRequestHookHandler, responseHandler } from './responseHandlers';
import { HookSpan, HooksManager } from '../middlewares/hooks';
import { ConditionalRouter } from '../services/conditionalRouter';
import { RouterError } from '../errors/RouterError';

/**
 * Constructs the request options for the API call.
 *
 * @param {any} headers - The headers to add in the request.
 * @param {string} provider - The provider for the request.
 * @param {string} method - The HTTP method for the request.
 * @returns {RequestInit} - The fetch options for the request.
 */
export function constructRequest(
  providerConfigMappedHeaders: any,
  provider: string,
  method: string,
  forwardHeaders: string[],
  requestHeaders: Record<string, string>
) {
  let baseHeaders: any = {
    'content-type': 'application/json',
  };

  let headers: Record<string, string> = {};

  Object.keys(providerConfigMappedHeaders).forEach((h: string) => {
    headers[h.toLowerCase()] = providerConfigMappedHeaders[h];
  });

  const forwardHeadersMap: Record<string, string> = {};

  forwardHeaders.forEach((h: string) => {
    const lowerCaseHeaderKey = h.toLowerCase();
    if (requestHeaders[lowerCaseHeaderKey])
      forwardHeadersMap[lowerCaseHeaderKey] =
        requestHeaders[lowerCaseHeaderKey];
  });

  // Add any headers that the model might need
  headers = { ...baseHeaders, ...headers, ...forwardHeadersMap };

  let fetchOptions: RequestInit = {
    method,
    headers,
  };
  const contentType = headers['content-type'];
  const isGetMethod = method === 'GET';
  const isMultipartFormData = contentType === CONTENT_TYPES.MULTIPART_FORM_DATA;
  const shouldDeleteContentTypeHeader =
    (isGetMethod || isMultipartFormData) && fetchOptions.headers;

  if (shouldDeleteContentTypeHeader) {
    let headers = fetchOptions.headers as Record<string, unknown>;
    delete headers['content-type'];
  }

  return fetchOptions;
}

/**
 * Selects a provider based on their assigned weights.
 * The weight is used to determine the probability of each provider being chosen.
 * If all providers have a weight of 0, an error will be thrown.
 *
 * @param {Options[]} providers - The available providers.
 * @returns {Options} - The selected provider.
 * @throws Will throw an error if no provider is selected, or if all weights are 0.
 */
export function selectProviderByWeight(providers: Options[]): Options {
  // Assign a default weight of 1 to providers with undefined weight
  providers = providers.map((provider) => ({
    ...provider,
    weight: provider.weight ?? 1,
  }));

  // Compute the total weight
  let totalWeight = providers.reduce(
    (sum: number, provider: any) => sum + provider.weight,
    0
  );

  // Select a random weight between 0 and totalWeight
  let randomWeight = Math.random() * totalWeight;

  // Find the provider that corresponds to the selected weight
  for (let [index, provider] of providers.entries()) {
    // @ts-ignore since weight is being default set above
    if (randomWeight < provider.weight) {
      return { ...provider, index };
    }
    // @ts-ignore since weight is being default set above
    randomWeight -= provider.weight;
  }

  throw new Error('No provider selected, please check the weights');
}

/**
 * @deprecated
 * Gets the provider options based on the specified mode.
 * Modes can be "single" (uses the first provider), "loadbalance" (selects one provider based on weights),
 * or "fallback" (uses all providers in the given order). If the mode does not match these options, null is returned.
 *
 * @param {string} mode - The mode for selecting providers.
 * @param {any} config - The configuration for the providers.
 * @returns {(Options[]|null)} - The selected provider options.
 */
export function getProviderOptionsByMode(
  mode: string,
  config: any
): Options[] | null {
  if (config.targets) {
    config.options = config.targets;
  }

  if (config.options) {
    // Inherit cache and retry from top level if not present on option level
    config.options.forEach((configOption: any) => {
      if (config.cache && !configOption.cache) {
        configOption.cache = config.cache;
      }
      if (config.retry && !configOption.retry) {
        configOption.retry = config.retry;
      }
    });
  }

  switch (mode) {
    case 'single':
      return [config.options[0]];
    case 'loadbalance':
      return [selectProviderByWeight(config.options)];
    case 'fallback':
      return config.options;
    default:
      return null;
  }
}

/**
 * @deprecated
 */
export const fetchProviderOptionsFromConfig = (
  config: Config | ShortConfig
): Options[] | null => {
  let providerOptions: Options[] | null = null;
  let mode: string;
  const camelCaseConfig = convertKeysToCamelCase(config, [
    'override_params',
    'params',
    'metadata',
  ]) as Config | ShortConfig;

  if ('provider' in camelCaseConfig) {
    providerOptions = [
      {
        provider: camelCaseConfig.provider,
        virtualKey: camelCaseConfig.virtualKey,
        apiKey: camelCaseConfig.apiKey,
        cache: camelCaseConfig.cache,
        retry: camelCaseConfig.retry,
        customHost: camelCaseConfig.customHost,
      },
    ];
    if (camelCaseConfig.resourceName)
      providerOptions[0].resourceName = camelCaseConfig.resourceName;
    if (camelCaseConfig.deploymentId)
      providerOptions[0].deploymentId = camelCaseConfig.deploymentId;
    if (camelCaseConfig.apiVersion)
      providerOptions[0].apiVersion = camelCaseConfig.apiVersion;
    if (camelCaseConfig.azureModelName)
      providerOptions[0].azureModelName = camelCaseConfig.azureModelName;
    if (camelCaseConfig.apiVersion)
      providerOptions[0].vertexProjectId = camelCaseConfig.vertexProjectId;
    if (camelCaseConfig.apiVersion)
      providerOptions[0].vertexRegion = camelCaseConfig.vertexRegion;
    if (camelCaseConfig.workersAiAccountId)
      providerOptions[0].workersAiAccountId =
        camelCaseConfig.workersAiAccountId;
    mode = 'single';
  } else {
    if (camelCaseConfig.strategy && camelCaseConfig.strategy.mode) {
      mode = camelCaseConfig.strategy.mode;
    } else {
      mode = camelCaseConfig.mode;
    }
    providerOptions = getProviderOptionsByMode(mode, camelCaseConfig);
  }
  return providerOptions;
};

/**
 * @deprecated
 * Makes a request (GET or POST) to a provider and returns the response.
 * The request is constructed using the provider, apiKey, and requestBody parameters.
 * The fn parameter is the type of request being made (e.g., "complete", "chatComplete").
 *
 * @param {Options} providerOption - The provider options. This object follows the Options interface and may contain a RetrySettings object for retry configuration.
 * @param {RequestBody} requestBody - The request body.
 * @param {string} fn - The function for the request.
 * @param {string} method - The method for the request (GET, POST).
 * @returns {Promise<CompletionResponse>} - The response from the request.
 * @throws Will throw an error if the response is not ok or if all retry attempts fail.
 */
export async function tryPostProxy(
  c: Context,
  providerOption: Options,
  inputParams: Params,
  requestHeaders: Record<string, string>,
  fn: endpointStrings,
  currentIndex: number,
  method: string = 'POST'
): Promise<Response> {
  const overrideParams = providerOption?.overrideParams || {};
  const params: Params = { ...inputParams, ...overrideParams };
  const isStreamingMode = params.stream ? true : false;

  const provider: string = providerOption.provider ?? '';

  // Mapping providers to corresponding URLs
  const apiConfig: ProviderAPIConfig = Providers[provider].api;

  const forwardHeaders: string[] = [];
  const customHost =
    requestHeaders[HEADER_KEYS.CUSTOM_HOST] || providerOption.customHost || '';
  const baseUrl =
    customHost || apiConfig.getBaseURL({ providerOptions: providerOption });
  const endpoint = apiConfig.getEndpoint({
    providerOptions: providerOption,
    fn,
    gatewayRequestBody: params,
  });

  const url = endpoint
    ? `${baseUrl}${endpoint}`
    : (providerOption.urlToFetch as string);

  const headers = await apiConfig.headers({
    providerOptions: providerOption,
    fn,
    transformedRequestBody: params,
    transformedRequestUrl: url,
  });

  const fetchOptions = constructRequest(
    headers,
    provider,
    method,
    forwardHeaders,
    requestHeaders
  );

  if (method === 'POST') {
    fetchOptions.body = JSON.stringify(params);
  }

  let response: Response;
  let retryCount: number | undefined;

  if (providerOption.retry && typeof providerOption.retry === 'object') {
    providerOption.retry = {
      attempts: providerOption.retry?.attempts ?? 0,
      onStatusCodes: providerOption.retry?.onStatusCodes ?? RETRY_STATUS_CODES,
    };
  } else if (typeof providerOption.retry === 'number') {
    providerOption.retry = {
      attempts: providerOption.retry,
      onStatusCodes: RETRY_STATUS_CODES,
    };
  } else {
    providerOption.retry = {
      attempts: 1,
      onStatusCodes: [],
    };
  }

  const getFromCacheFunction = c.get('getFromCache');
  const cacheIdentifier = c.get('cacheIdentifier');
  const requestOptions = c.get('requestOptions') ?? [];

  let cacheResponse, cacheKey, cacheMode, cacheMaxAge;
  let cacheStatus = 'DISABLED';

  if (requestHeaders[HEADER_KEYS.CACHE]) {
    cacheMode = requestHeaders[HEADER_KEYS.CACHE];
  } else if (
    providerOption?.cache &&
    typeof providerOption.cache === 'object' &&
    providerOption.cache.mode
  ) {
    cacheMode = providerOption.cache.mode;
    cacheMaxAge = providerOption.cache.maxAge;
  } else if (
    providerOption?.cache &&
    typeof providerOption.cache === 'string'
  ) {
    cacheMode = providerOption.cache;
  }

  if (getFromCacheFunction && cacheMode) {
    [cacheResponse, cacheStatus, cacheKey] = await getFromCacheFunction(
      env(c),
      { ...requestHeaders, ...fetchOptions.headers },
      params,
      url,
      cacheIdentifier,
      cacheMode,
      cacheMaxAge
    );
    if (cacheResponse) {
      ({ response } = await responseHandler(
        new Response(cacheResponse, {
          headers: {
            'content-type': 'application/json',
          },
        }),
        false,
        provider,
        undefined,
        url,
        false,
        params,
        false
      ));

      c.set('requestOptions', [
        ...requestOptions,
        {
          providerOptions: {
            ...providerOption,
            requestURL: url,
            rubeusURL: fn,
          },
          requestParams: params,
          response: response.clone(),
          cacheStatus: cacheStatus,
          lastUsedOptionIndex: currentIndex,
          cacheKey: cacheKey,
          cacheMode: cacheMode,
          cacheMaxAge: cacheMaxAge,
        },
      ]);
      updateResponseHeaders(
        response,
        currentIndex,
        params,
        cacheStatus,
        0,
        requestHeaders[HEADER_KEYS.TRACE_ID] ?? ''
      );
      return response;
    }
  }

  [response, retryCount] = await retryRequest(
    url,
    fetchOptions,
    providerOption.retry.attempts,
    providerOption.retry.onStatusCodes,
    null
  );
  const mappedResponse = await responseHandler(
    response,
    isStreamingMode,
    provider,
    undefined,
    url,
    false,
    params,
    false
  );
  updateResponseHeaders(
    mappedResponse.response,
    currentIndex,
    params,
    cacheStatus,
    retryCount ?? 0,
    requestHeaders[HEADER_KEYS.TRACE_ID] ?? ''
  );

  c.set('requestOptions', [
    ...requestOptions,
    {
      providerOptions: {
        ...providerOption,
        requestURL: url,
        rubeusURL: fn,
      },
      requestParams: params,
      response: mappedResponse.response.clone(),
      cacheStatus: cacheStatus,
      lastUsedOptionIndex: currentIndex,
      cacheKey: cacheKey,
      cacheMode: cacheMode,
    },
  ]);
  // If the response was not ok, throw an error
  if (!response.ok) {
    // Check if this request needs to be retried
    const errorObj: any = new Error(await mappedResponse.response.text());
    errorObj.status = mappedResponse.response.status;
    throw errorObj;
  }

  return mappedResponse.response;
}

/**
 * Makes a POST request to a provider and returns the response.
 * The POST request is constructed using the provider, apiKey, and requestBody parameters.
 * The fn parameter is the type of request being made (e.g., "complete", "chatComplete").
 *
 * @param {Options} providerOption - The provider options. This object follows the Options interface and may contain a RetrySettings object for retry configuration.
 * @param {RequestBody} requestBody - The request body.
 * @param {string} fn - The function for the request.
 * @returns {Promise<CompletionResponse>} - The response from the POST request.
 * @throws Will throw an error if the response is not ok or if all retry attempts fail.
 */
export async function tryPost(
  c: Context,
  providerOption: Options,
  inputParams: Params | FormData,
  requestHeaders: Record<string, string>,
  fn: endpointStrings,
  currentIndex: number | string
): Promise<Response> {
  const overrideParams = providerOption?.overrideParams || {};
  const params: Params = { ...inputParams, ...overrideParams };
  const isStreamingMode = params.stream ? true : false;
  let strictOpenAiCompliance = true;

  if (requestHeaders[HEADER_KEYS.STRICT_OPEN_AI_COMPLIANCE] === 'false') {
    strictOpenAiCompliance = false;
  } else if (providerOption.strictOpenAiCompliance === false) {
    strictOpenAiCompliance = false;
  }

  const provider: string = providerOption.provider ?? '';

  const hooksManager = c.get('hooksManager');
  const hookSpan = hooksManager.createSpan(
    params,
    provider,
    isStreamingMode,
    providerOption.beforeRequestHooks || [],
    providerOption.afterRequestHooks || [],
    null,
    fn
  );

  // Mapping providers to corresponding URLs
  const apiConfig: ProviderAPIConfig = Providers[provider].api;
  // Attach the body of the request
  const transformedRequestBody = transformToProviderRequest(
    provider,
    params,
    inputParams,
    fn
  );

  const forwardHeaders =
    requestHeaders[HEADER_KEYS.FORWARD_HEADERS]
      ?.split(',')
      .map((h) => h.trim()) ||
    providerOption.forwardHeaders ||
    [];

  const customHost =
    requestHeaders[HEADER_KEYS.CUSTOM_HOST] || providerOption.customHost || '';

  const baseUrl =
    customHost || apiConfig.getBaseURL({ providerOptions: providerOption });

  const endpoint = apiConfig.getEndpoint({
    providerOptions: providerOption,
    fn,
    gatewayRequestBody: params,
  });
  const url = `${baseUrl}${endpoint}`;

  const headers = await apiConfig.headers({
    providerOptions: providerOption,
    fn,
    transformedRequestBody,
    transformedRequestUrl: url,
  });

  // Construct the base object for the POST request
  const fetchOptions = constructRequest(
    headers,
    provider,
    'POST',
    forwardHeaders,
    requestHeaders
  );

  fetchOptions.body = MULTIPART_FORM_DATA_ENDPOINTS.includes(fn)
    ? (transformedRequestBody as FormData)
    : JSON.stringify(transformedRequestBody);

  providerOption.retry = {
    attempts: providerOption.retry?.attempts ?? 0,
    onStatusCodes: providerOption.retry?.onStatusCodes ?? RETRY_STATUS_CODES,
  };

  const requestOptions = c.get('requestOptions') ?? [];

  let mappedResponse: Response, retryCount: number | undefined;

  let cacheKey: string | undefined;
  let { cacheMode, cacheMaxAge, cacheStatus } = getCacheOptions(
    providerOption.cache
  );
  let cacheResponse: Response | undefined;

  let brhResponse: Response | undefined;

  async function createResponse(
    response: Response,
    responseTransformer: string | undefined,
    isCacheHit: boolean,
    isResponseAlreadyMapped: boolean = false
  ) {
    if (!isResponseAlreadyMapped) {
      ({ response: mappedResponse } = await responseHandler(
        response,
        isStreamingMode,
        provider,
        responseTransformer,
        url,
        isCacheHit,
        params,
        strictOpenAiCompliance
      ));
    }

    updateResponseHeaders(
      mappedResponse as Response,
      currentIndex,
      params,
      cacheStatus,
      retryCount ?? 0,
      requestHeaders[HEADER_KEYS.TRACE_ID] ?? ''
    );

    c.set('requestOptions', [
      ...requestOptions,
      {
        providerOptions: {
          ...providerOption,
          requestURL: url,
          rubeusURL: fn,
        },
        requestParams: transformedRequestBody,
        response: mappedResponse.clone(),
        cacheStatus: cacheStatus,
        lastUsedOptionIndex: currentIndex,
        cacheKey: cacheKey,
        cacheMode: cacheMode,
        cacheMaxAge: cacheMaxAge,
        hookSpanId: hookSpan.id,
      },
    ]);

    // If the response was not ok, throw an error
    if (!mappedResponse.ok) {
      const errorObj: any = new Error(await mappedResponse.clone().text());
      errorObj.status = mappedResponse.status;
      errorObj.response = mappedResponse;
      throw errorObj;
    }

    return mappedResponse;
  }

  // BeforeHooksHandler
  brhResponse = await beforeRequestHookHandler(c, hookSpan.id);

  if (!!brhResponse) {
    // If before requestHandler returns a response, return it
    return createResponse(brhResponse, undefined, false);
  }

  // Cache Handler
  ({ cacheResponse, cacheStatus, cacheKey } = await cacheHandler(
    c,
    providerOption,
    requestHeaders,
    fetchOptions,
    transformedRequestBody,
    hookSpan.id,
    fn
  ));
  if (!!cacheResponse) {
    return createResponse(cacheResponse, fn, true);
  }

  // Prerequest validator (For virtual key budgets)
  const preRequestValidator = c.get('preRequestValidator');
  let preRequestValidatorResponse = preRequestValidator
    ? await preRequestValidator(env(c), providerOption, requestHeaders)
    : undefined;
  if (!!preRequestValidatorResponse) {
    return createResponse(preRequestValidatorResponse, undefined, false);
  }

  // Request Handler (Including retries, recursion and hooks)
  [mappedResponse, retryCount] = await recursiveAfterRequestHookHandler(
    c,
    url,
    fetchOptions,
    providerOption,
    isStreamingMode,
    params,
    0,
    fn,
    requestHeaders,
    hookSpan.id,
    strictOpenAiCompliance
  );

  return createResponse(mappedResponse, undefined, false, true);
}

/**
 * @deprecated
 * Tries providers in sequence until a successful response is received.
 * The providers are attempted in the order they are given in the providers parameter.
 * If all providers fail, an error is thrown with the details of the errors from each provider.
 *
 * @param {Options[]} providers - The providers to try. Each object in the array follows the Options interface and may contain a RetrySettings object for retry configuration.
 * @param {RequestBody} request - The request body.
 * @param {endpointStrings} fn - The function for the request.
 * @param {String} method - The method to be used (GET, POST) for the request.
 * @returns {Promise<CompletionResponse>} - The response from the first successful provider.
 * @throws Will throw an error if all providers fail.
 */
export async function tryProvidersInSequence(
  c: Context,
  providers: Options[],
  params: Params,
  requestHeaders: Record<string, string>,
  fn: endpointStrings,
  method: string = 'POST'
): Promise<Response> {
  let errors: any[] = [];
  for (let [index, providerOption] of providers.entries()) {
    try {
      const loadbalanceIndex = !isNaN(Number(providerOption.index))
        ? Number(providerOption.index)
        : null;
      if (fn === 'proxy') {
        return await tryPostProxy(
          c,
          providerOption,
          params,
          requestHeaders,
          fn,
          loadbalanceIndex ?? index,
          method
        );
      }
      return await tryPost(
        c,
        providerOption,
        params,
        requestHeaders,
        fn,
        loadbalanceIndex ?? index
      );
    } catch (error: any) {
      // Log and store the error
      errors.push({
        provider: providerOption.provider,
        errorObj: error.message,
        status: error.status,
      });
    }
  }
  // If we're here, all providers failed. Throw an error with the details.
  throw new Error(JSON.stringify(errors));
}

export async function tryTargetsRecursively(
  c: Context,
  targetGroup: Targets,
  request: Params | FormData,
  requestHeaders: Record<string, string>,
  fn: endpointStrings,
  method: string,
  jsonPath: string,
  inheritedConfig: Record<string, any> = {}
): Promise<Response> {
  let currentTarget: any = { ...targetGroup };
  let currentJsonPath = jsonPath;
  const strategyMode = currentTarget.strategy?.mode;

  // start: merge inherited config with current target config (preference given to current)
  const currentInheritedConfig: Record<string, any> = {
    overrideParams: {
      ...inheritedConfig.overrideParams,
      ...currentTarget.overrideParams,
    },
    retry: currentTarget.retry
      ? { ...currentTarget.retry }
      : { ...inheritedConfig.retry },
    cache: currentTarget.cache
      ? { ...currentTarget.cache }
      : { ...inheritedConfig.cache },
    requestTimeout: null,
  };

  if (typeof currentTarget.strictOpenAiCompliance === 'boolean') {
    currentInheritedConfig.strictOpenAiCompliance =
      currentTarget.strictOpenAiCompliance;
  } else if (typeof inheritedConfig.strictOpenAiCompliance === 'boolean') {
    currentInheritedConfig.strictOpenAiCompliance =
      inheritedConfig.strictOpenAiCompliance;
  }

  if (currentTarget.forwardHeaders) {
    currentInheritedConfig.forwardHeaders = [...currentTarget.forwardHeaders];
  } else if (inheritedConfig.forwardHeaders) {
    currentInheritedConfig.forwardHeaders = [...inheritedConfig.forwardHeaders];
    currentTarget.forwardHeaders = [...inheritedConfig.forwardHeaders];
  }

  if (currentTarget.customHost) {
    currentInheritedConfig.customHost = currentTarget.customHost;
  } else if (inheritedConfig.customHost) {
    currentInheritedConfig.customHost = inheritedConfig.customHost;
    currentTarget.customHost = inheritedConfig.customHost;
  }

  if (currentTarget.requestTimeout) {
    currentInheritedConfig.requestTimeout = currentTarget.requestTimeout;
  } else if (inheritedConfig.requestTimeout) {
    currentInheritedConfig.requestTimeout = inheritedConfig.requestTimeout;
    currentTarget.requestTimeout = inheritedConfig.requestTimeout;
  }

  if (currentTarget.afterRequestHooks) {
    currentInheritedConfig.afterRequestHooks = [
      ...currentTarget.afterRequestHooks,
    ];
  } else if (inheritedConfig.afterRequestHooks) {
    currentInheritedConfig.afterRequestHooks = [
      ...inheritedConfig.afterRequestHooks,
    ];
    currentTarget.afterRequestHooks = [...inheritedConfig.afterRequestHooks];
  }

  if (currentTarget.beforeRequestHooks) {
    currentInheritedConfig.beforeRequestHooks = [
      ...currentTarget.beforeRequestHooks,
    ];
  } else if (inheritedConfig.beforeRequestHooks) {
    currentInheritedConfig.beforeRequestHooks = [
      ...inheritedConfig.beforeRequestHooks,
    ];
    currentTarget.beforeRequestHooks = [...inheritedConfig.beforeRequestHooks];
  }

  currentTarget.overrideParams = {
    ...currentInheritedConfig.overrideParams,
  };

  currentTarget.retry = {
    ...currentInheritedConfig.retry,
  };

  currentTarget.cache = {
    ...currentInheritedConfig.cache,
  };
  // end: merge inherited config with current target config (preference given to current)

  let response;

  switch (strategyMode) {
    case StrategyModes.FALLBACK:
      for (let [index, target] of currentTarget.targets.entries()) {
        response = await tryTargetsRecursively(
          c,
          target,
          request,
          requestHeaders,
          fn,
          method,
          `${currentJsonPath}.targets[${index}]`,
          currentInheritedConfig
        );
        if (
          response?.ok &&
          !currentTarget.strategy?.onStatusCodes?.includes(response?.status)
        ) {
          break;
        }
      }
      break;

    case StrategyModes.LOADBALANCE:
      currentTarget.targets.forEach((t: Options) => {
        if (t.weight === undefined) {
          t.weight = 1;
        }
      });
      let totalWeight = currentTarget.targets.reduce(
        (sum: number, provider: any) => sum + provider.weight,
        0
      );

      let randomWeight = Math.random() * totalWeight;
      for (let [index, provider] of currentTarget.targets.entries()) {
        if (randomWeight < provider.weight) {
          currentJsonPath = currentJsonPath + `.targets[${index}]`;
          response = await tryTargetsRecursively(
            c,
            provider,
            request,
            requestHeaders,
            fn,
            method,
            currentJsonPath,
            currentInheritedConfig
          );
          break;
        }
        randomWeight -= provider.weight;
      }
      break;

    case StrategyModes.CONDITIONAL:
      let metadata: Record<string, string>;
      try {
        metadata = JSON.parse(requestHeaders[HEADER_KEYS.METADATA]);
      } catch (err) {
        metadata = {};
      }
      let conditionalRouter: ConditionalRouter;
      let finalTarget: Targets;
      try {
        conditionalRouter = new ConditionalRouter(currentTarget, { metadata });
        finalTarget = conditionalRouter.resolveTarget();
      } catch (conditionalRouter: any) {
        throw new RouterError(conditionalRouter.message);
      }

      response = await tryTargetsRecursively(
        c,
        finalTarget,
        request,
        requestHeaders,
        fn,
        method,
        `${currentJsonPath}.targets[${finalTarget.index}]`,
        currentInheritedConfig
      );
      break;

    case StrategyModes.SINGLE:
      response = await tryTargetsRecursively(
        c,
        currentTarget.targets[0],
        request,
        requestHeaders,
        fn,
        method,
        `${currentJsonPath}.targets[0]`,
        currentInheritedConfig
      );
      break;

    default:
      try {
        response = await tryPost(
          c,
          currentTarget,
          request,
          requestHeaders,
          fn,
          currentJsonPath
        );
      } catch (error: any) {
        response = error.response;
      }
      break;
  }

  return response;
}

/**
 * Updates the response headers with the provided values.
 * @param {Response} response - The response object.
 * @param {string | number} currentIndex - The current index value.
 * @param {Record<string, any>} params - The parameters object.
 * @param {string} cacheStatus - The cache status value.
 * @param {number} retryAttempt - The retry attempt count.
 * @param {string} traceId - The trace ID value.
 */
export function updateResponseHeaders(
  response: Response,
  currentIndex: string | number,
  params: Record<string, any>,
  cacheStatus: string | undefined,
  retryAttempt: number,
  traceId: string
) {
  response.headers.append(
    RESPONSE_HEADER_KEYS.LAST_USED_OPTION_INDEX,
    currentIndex.toString()
  );

  if (cacheStatus) {
    response.headers.append(RESPONSE_HEADER_KEYS.CACHE_STATUS, cacheStatus);
  }
  response.headers.append(RESPONSE_HEADER_KEYS.TRACE_ID, traceId);
  response.headers.append(
    RESPONSE_HEADER_KEYS.RETRY_ATTEMPT_COUNT,
    retryAttempt.toString()
  );

  const contentEncodingHeader = response.headers.get('content-encoding');
  if (contentEncodingHeader && contentEncodingHeader.indexOf('br') > -1) {
    // Brotli compression causes errors at runtime, removing the header in that case
    response.headers.delete('content-encoding');
  }
  if (getRuntimeKey() == 'node') {
    response.headers.delete('content-encoding');
  }

  // Delete content-length header to avoid conflicts with hono compress middleware
  // workerd environment handles this authomatically
  response.headers.delete('content-length');
}

export function constructConfigFromRequestHeaders(
  requestHeaders: Record<string, any>
): Options | Targets {
  const azureConfig = {
    resourceName: requestHeaders[`x-${POWERED_BY}-azure-resource-name`],
    deploymentId: requestHeaders[`x-${POWERED_BY}-azure-deployment-id`],
    apiVersion: requestHeaders[`x-${POWERED_BY}-azure-api-version`],
    azureModelName: requestHeaders[`x-${POWERED_BY}-azure-model-name`],
  };

  const azureAiInferenceConfig = {
    azureDeploymentName:
      requestHeaders[`x-${POWERED_BY}-azure-deployment-name`],
    azureRegion: requestHeaders[`x-${POWERED_BY}-azure-region`],
    azureDeploymentType:
      requestHeaders[`x-${POWERED_BY}-azure-deployment-type`],
    azureApiVersion: requestHeaders[`x-${POWERED_BY}-azure-api-version`],
    azureEndpointName: requestHeaders[`x-${POWERED_BY}-azure-endpoint-name`],
  };

  const bedrockConfig = {
    awsAccessKeyId: requestHeaders[`x-${POWERED_BY}-aws-access-key-id`],
    awsSecretAccessKey: requestHeaders[`x-${POWERED_BY}-aws-secret-access-key`],
    awsSessionToken: requestHeaders[`x-${POWERED_BY}-aws-session-token`],
    awsRegion: requestHeaders[`x-${POWERED_BY}-aws-region`],
  };

  const workersAiConfig = {
    workersAiAccountId: requestHeaders[`x-${POWERED_BY}-workers-ai-account-id`],
  };

  const openAiConfig = {
    openaiOrganization: requestHeaders[`x-${POWERED_BY}-openai-organization`],
    openaiProject: requestHeaders[`x-${POWERED_BY}-openai-project`],
  };

  const huggingfaceConfig = {
    huggingfaceBaseUrl: requestHeaders[`x-${POWERED_BY}-huggingface-base-url`],
  };

  const vertexConfig: Record<string, any> = {
    vertexProjectId: requestHeaders[`x-${POWERED_BY}-vertex-project-id`],
    vertexRegion: requestHeaders[`x-${POWERED_BY}-vertex-region`],
  };

  const anthropicConfig = {
    anthropicBeta: requestHeaders[`x-${POWERED_BY}-anthropic-beta`],
    anthropicVersion: requestHeaders[`x-${POWERED_BY}-anthropic-version`],
  };

  let vertexServiceAccountJson =
    requestHeaders[`x-${POWERED_BY}-vertex-service-account-json`];
  if (vertexServiceAccountJson) {
    try {
      vertexConfig.vertexServiceAccountJson = JSON.parse(
        vertexServiceAccountJson
      );
    } catch (e) {
      vertexConfig.vertexServiceAccountJson = null;
    }
  }

  if (requestHeaders[`x-${POWERED_BY}-config`]) {
    let parsedConfigJson = JSON.parse(requestHeaders[`x-${POWERED_BY}-config`]);

    if (!parsedConfigJson.provider && !parsedConfigJson.targets) {
      parsedConfigJson.provider = requestHeaders[`x-${POWERED_BY}-provider`];
      parsedConfigJson.api_key = requestHeaders['authorization']?.replace(
        'Bearer ',
        ''
      );

      if (parsedConfigJson.provider === AZURE_OPEN_AI) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...azureConfig,
        };
      }

      if (parsedConfigJson.provider === BEDROCK) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...bedrockConfig,
        };
      }

      if (parsedConfigJson.provider === WORKERS_AI) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...workersAiConfig,
        };
      }

      if (parsedConfigJson.provider === OPEN_AI) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...openAiConfig,
        };
      }

      if (parsedConfigJson.provider === HUGGING_FACE) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...huggingfaceConfig,
        };
      }

      if (parsedConfigJson.provider === GOOGLE_VERTEX_AI) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...vertexConfig,
        };
      }

      if (parsedConfigJson.provider === AZURE_AI_INFERENCE) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...azureAiInferenceConfig,
        };
      }
      if (parsedConfigJson.provider === ANTHROPIC) {
        parsedConfigJson = {
          ...parsedConfigJson,
          ...anthropicConfig,
        };
      }
    }
    return convertKeysToCamelCase(parsedConfigJson, [
      'override_params',
      'params',
      'checks',
      'vertex_service_account_json',
      'conditions',
    ]) as any;
  }

  return {
    provider: requestHeaders[`x-${POWERED_BY}-provider`],
    apiKey: requestHeaders['authorization']?.replace('Bearer ', ''),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === AZURE_OPEN_AI &&
      azureConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === BEDROCK &&
      bedrockConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === WORKERS_AI &&
      workersAiConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === GOOGLE_VERTEX_AI &&
      vertexConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === AZURE_AI_INFERENCE &&
      azureAiInferenceConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === OPEN_AI && openAiConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === ANTHROPIC &&
      anthropicConfig),
    ...(requestHeaders[`x-${POWERED_BY}-provider`] === HUGGING_FACE &&
      huggingfaceConfig),
  };
}

export async function recursiveAfterRequestHookHandler(
  c: Context,
  url: any,
  options: any,
  providerOption: Options,
  isStreamingMode: any,
  gatewayParams: any,
  retryAttemptsMade: any,
  fn: any,
  requestHeaders: Record<string, string>,
  hookSpanId: string,
  strictOpenAiCompliance: boolean
): Promise<[Response, number]> {
  let response, retryCount;
  const requestTimeout =
    Number(requestHeaders[HEADER_KEYS.REQUEST_TIMEOUT]) ||
    providerOption.requestTimeout ||
    null;

  const { retry } = providerOption;

  [response, retryCount] = await retryRequest(
    url,
    options,
    retry?.attempts || 0,
    retry?.onStatusCodes || [],
    requestTimeout || null
  );

  const { response: mappedResponse, responseJson: mappedResponseJson } =
    await responseHandler(
      response,
      isStreamingMode,
      providerOption,
      fn,
      url,
      false,
      gatewayParams,
      strictOpenAiCompliance
    );

  const arhResponse = await afterRequestHookHandler(
    c,
    mappedResponse,
    mappedResponseJson,
    hookSpanId,
    retryAttemptsMade
  );

  const remainingRetryCount =
    (retry?.attempts || 0) - (retryCount || 0) - retryAttemptsMade;

  if (
    remainingRetryCount > 0 &&
    retry?.onStatusCodes?.includes(arhResponse.status)
  ) {
    return recursiveAfterRequestHookHandler(
      c,
      url,
      options,
      providerOption,
      isStreamingMode,
      gatewayParams,
      (retryCount || 0) + 1 + retryAttemptsMade,
      fn,
      requestHeaders,
      hookSpanId,
      strictOpenAiCompliance
    );
  }

  return [arhResponse, retryAttemptsMade];
}

/**
 * Retrieves the cache options based on the provided cache configuration.
 * @param cacheConfig - The cache configuration object or string.
 * @returns An object containing the cache mode and cache max age.
 */
function getCacheOptions(cacheConfig: any) {
  // providerOption.cache needs to be sent here
  let cacheMode: string | undefined;
  let cacheMaxAge: string | number = '';
  let cacheStatus = 'DISABLED';

  if (typeof cacheConfig === 'object' && cacheConfig?.mode) {
    cacheMode = cacheConfig.mode;
    cacheMaxAge = cacheConfig.maxAge;
  } else if (typeof cacheConfig === 'string') {
    cacheMode = cacheConfig;
  }
  return { cacheMode, cacheMaxAge, cacheStatus };
}

async function cacheHandler(
  c: Context,
  providerOption: Options,
  requestHeaders: Record<string, string>,
  fetchOptions: any,
  transformedRequestBody: any,
  hookSpanId: string,
  fn: endpointStrings
) {
  const [getFromCacheFunction, cacheIdentifier] = [
    c.get('getFromCache'),
    c.get('cacheIdentifier'),
  ];

  let cacheResponse, cacheKey;
  let cacheMode: string | undefined,
    cacheMaxAge: string | number | undefined,
    cacheStatus: string;
  ({ cacheMode, cacheMaxAge, cacheStatus } = getCacheOptions(
    providerOption.cache
  ));

  if (getFromCacheFunction && cacheMode) {
    [cacheResponse, cacheStatus, cacheKey] = await getFromCacheFunction(
      env(c),
      { ...requestHeaders, ...fetchOptions.headers },
      transformedRequestBody,
      fn,
      cacheIdentifier,
      cacheMode,
      cacheMaxAge
    );
  }

  const hooksManager = c.get('hooksManager') as HooksManager;
  const span = hooksManager.getSpan(hookSpanId) as HookSpan;
  const results = span.getHooksResult();
  const failedBeforeRequestHooks = results.beforeRequestHooksResult?.filter(
    (h) => !h.verdict
  );

  let responseBody = cacheResponse;

  const hasHookResults = results.beforeRequestHooksResult?.length > 0;
  const responseStatus = failedBeforeRequestHooks.length ? 246 : 200;

  if (hasHookResults && cacheResponse) {
    responseBody = JSON.stringify({
      ...JSON.parse(cacheResponse),
      hook_results: {
        before_request_hooks: results.beforeRequestHooksResult,
      },
    });
  }

  return {
    cacheResponse: !!cacheResponse
      ? new Response(responseBody, {
          headers: { 'content-type': 'application/json' },
          status: responseStatus,
        })
      : undefined,
    cacheStatus,
    cacheKey,
  };
}

export async function beforeRequestHookHandler(
  c: Context,
  hookSpanId: string
): Promise<any> {
  try {
    const hooksManager = c.get('hooksManager');
    const hooksResult = await hooksManager.executeHooks(hookSpanId, [
      'syncBeforeRequestHook',
    ]);

    if (hooksResult.shouldDeny) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'The guardrail checks defined in the config failed. You can find more information in the `hook_results` object.',
            type: 'hooks_failed',
            param: null,
            code: null,
          },
          hook_results: {
            before_request_hooks: hooksResult.results,
            after_request_hooks: [],
          },
        }),
        {
          status: 446,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  } catch (err) {
    console.log(err);
    return { error: err };
    // TODO: Handle this error!!!
  }
}
