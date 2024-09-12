import { Context } from 'hono';
import { env } from 'hono/adapter';
import {
  ANTHROPIC,
  AZURE_OPEN_AI,
  CONTENT_TYPES,
  HEADER_KEYS,
  MAX_RETRIES,
  OLLAMA,
  POWERED_BY,
  RETRY_STATUS_CODES,
  TRITON,
} from '../globals';
import Providers from '../providers';
import { Config, ShortConfig } from '../types/requestBody';
import { convertKeysToCamelCase, getStreamingMode } from '../utils';
import {
  fetchProviderOptionsFromConfig,
  tryProvidersInSequence,
  updateResponseHeaders,
} from './handlerUtils';
import { retryRequest } from './retryHandler';
import { responseHandler } from './responseHandlers';
// Find the proxy provider
function proxyProvider(proxyModeHeader: string, providerHeader: string) {
  const proxyProvider = proxyModeHeader?.split(' ')[1] ?? providerHeader;
  return proxyProvider;
}

function getProxyPath(
  requestURL: string,
  proxyProvider: string,
  proxyEndpointPath: string,
  customHost: string
) {
  let reqURL = new URL(requestURL);
  let reqPath = reqURL.pathname;
  const reqQuery = reqURL.search;
  reqPath = reqPath.replace(proxyEndpointPath, '');

  if (customHost) {
    return `${customHost}${reqPath}${reqQuery}`;
  }

  const providerBasePath = Providers[proxyProvider].api.getBaseURL({
    providerOptions: {},
  });
  if (proxyProvider === AZURE_OPEN_AI) {
    return `https:/${reqPath}${reqQuery}`;
  }

  if (proxyProvider === OLLAMA || proxyProvider === TRITON) {
    return `https:/${reqPath}`;
  }
  let proxyPath = `${providerBasePath}${reqPath}${reqQuery}`;

  // Fix specific for Anthropic SDK calls. Is this needed? - Yes
  if (proxyProvider === ANTHROPIC) {
    proxyPath = proxyPath.replace('/v1/v1/', '/v1/');
  }

  return proxyPath;
}

async function getRequestData(request: Request, contentType: string) {
  let requestJSON: Record<string, any> = {};
  let requestFormData;
  let requestBody = '';
  let requestBinary: ArrayBuffer = new ArrayBuffer(0);

  if (contentType == CONTENT_TYPES.APPLICATION_JSON) {
    if (['GET', 'DELETE'].includes(request.method)) {
      return { requestJSON, requestFormData };
    }
    requestBody = await request.text();
    requestJSON = JSON.parse(requestBody);
  } else if (contentType == CONTENT_TYPES.MULTIPART_FORM_DATA) {
    requestFormData = await request.formData();
    requestFormData.forEach(function (value, key) {
      requestJSON[key] = value;
    });
  } else if (contentType.startsWith(CONTENT_TYPES.GENERIC_AUDIO_PATTERN)) {
    requestBinary = await request.arrayBuffer();
  }

  return { requestJSON, requestFormData, requestBinary };
}

function headersToSend(
  headersObj: Record<string, string>,
  customHeadersToIgnore: Array<string>
): Record<string, string> {
  let final: Record<string, string> = {};
  const poweredByHeadersPattern = `x-${POWERED_BY}-`;
  const headersToAvoidForCloudflare = ['expect'];
  const headersToAvoid = [
    ...customHeadersToIgnore,
    ...headersToAvoidForCloudflare,
  ];
  if (
    headersObj['content-type']?.split(';')[0] ===
    CONTENT_TYPES.MULTIPART_FORM_DATA
  ) {
    headersToAvoid.push('content-type');
  }
  headersToAvoid.push('content-length');
  Object.keys(headersObj).forEach((key: string) => {
    if (
      !headersToAvoid.includes(key) &&
      !key.startsWith(poweredByHeadersPattern)
    ) {
      final[key] = headersObj[key];
    }
  });

  // Remove brotli from accept-encoding because cloudflare has problems with it
  if (final['accept-encoding']?.includes('br'))
    final['accept-encoding'] = final['accept-encoding']?.replace('br', '');

  return final;
}

export async function proxyHandler(c: Context): Promise<Response> {
  try {
    const requestHeaders = Object.fromEntries(c.req.raw.headers);
    const requestContentType = requestHeaders['content-type']?.split(';')[0];
    const { requestJSON, requestFormData, requestBinary } =
      await getRequestData(c.req.raw, requestContentType);
    const store: Record<string, any> = {
      proxyProvider: proxyProvider(
        requestHeaders[HEADER_KEYS.MODE],
        requestHeaders[`x-${POWERED_BY}-provider`]
      ),
      reqBody: requestJSON,
      requestFormData: requestFormData,
      customHeadersToAvoid: env(c).CUSTOM_HEADERS_TO_IGNORE ?? [],
      proxyPath: c.req.url.indexOf('/v1/proxy') > -1 ? '/v1/proxy' : '/v1',
    };

    let requestConfig: Config | ShortConfig | null = null;
    if (requestHeaders[`x-${POWERED_BY}-config`]) {
      requestConfig = JSON.parse(requestHeaders[`x-${POWERED_BY}-config`]);
      if (requestConfig && 'provider' in requestConfig) {
        store.proxyProvider = requestConfig.provider;
      }
    }

    const customHost =
      requestHeaders[HEADER_KEYS.CUSTOM_HOST] ||
      requestConfig?.customHost ||
      '';
    let urlToFetch = getProxyPath(
      c.req.url,
      store.proxyProvider,
      store.proxyPath,
      customHost
    );
    store.isStreamingMode = getStreamingMode(
      store.reqBody,
      store.proxyProvider,
      urlToFetch
    );

    if (
      requestConfig &&
      (('options' in requestConfig && requestConfig.options) ||
        ('targets' in requestConfig && requestConfig.targets) ||
        ('provider' in requestConfig && requestConfig.provider))
    ) {
      let providerOptions = fetchProviderOptionsFromConfig(requestConfig);

      if (!providerOptions) {
        return new Response(
          JSON.stringify({
            status: 'failure',
            message: 'Could not find a provider option.',
          }),
          {
            status: 400,
            headers: {
              'content-type': 'application/json',
            },
          }
        );
      }

      providerOptions = providerOptions.map((po) => ({
        ...po,
        urlToFetch,
      }));

      try {
        return await tryProvidersInSequence(
          c,
          providerOptions,
          store.reqBody,
          requestHeaders,
          'proxy'
        );
      } catch (error: any) {
        const errorArray = JSON.parse(error.message);
        return new Response(errorArray[errorArray.length - 1].errorObj, {
          status: errorArray[errorArray.length - 1].status,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
    }

    if (requestConfig) {
      requestConfig = convertKeysToCamelCase(
        requestConfig as Record<string, any>,
        ['override_params', 'params', 'metadata']
      ) as Config | ShortConfig;
    }

    let body;
    if (requestContentType.startsWith(CONTENT_TYPES.GENERIC_AUDIO_PATTERN)) {
      body = requestBinary;
    } else if (requestContentType === CONTENT_TYPES.MULTIPART_FORM_DATA) {
      body = store.requestFormData;
    } else {
      body = JSON.stringify(store.reqBody);
    }

    let fetchOptions = {
      headers: headersToSend(requestHeaders, store.customHeadersToAvoid),
      method: c.req.method,
      body: body,
    };

    let retryCount = 0;
    let retryStatusCodes = RETRY_STATUS_CODES;
    if (requestHeaders[HEADER_KEYS.RETRIES]) {
      retryCount = parseInt(requestHeaders[HEADER_KEYS.RETRIES]);
    } else if (
      requestConfig?.retry &&
      typeof requestConfig.retry === 'object'
    ) {
      (retryCount = requestConfig.retry?.attempts ?? 1),
        (retryStatusCodes =
          requestConfig.retry?.onStatusCodes ?? RETRY_STATUS_CODES);
    }

    retryCount = Math.min(retryCount, MAX_RETRIES);

    const getFromCacheFunction = c.get('getFromCache');
    const cacheIdentifier = c.get('cacheIdentifier');

    let cacheResponse, cacheKey, cacheMaxAge;
    let cacheStatus = 'DISABLED';
    let cacheMode = requestHeaders[HEADER_KEYS.CACHE];

    if (
      requestConfig?.cache &&
      typeof requestConfig.cache === 'object' &&
      requestConfig.cache.mode
    ) {
      cacheMode = requestConfig.cache.mode;
      cacheMaxAge = requestConfig.cache.maxAge;
    } else if (
      requestConfig?.cache &&
      typeof requestConfig.cache === 'string'
    ) {
      cacheMode = requestConfig.cache;
    }

    if (getFromCacheFunction && cacheMode) {
      [cacheResponse, cacheStatus, cacheKey] = await getFromCacheFunction(
        env(c),
        { ...requestHeaders, ...fetchOptions.headers },
        store.reqBody,
        urlToFetch,
        cacheIdentifier,
        cacheMode
      );
      if (cacheResponse) {
        const { response: cacheMappedResponse } = await responseHandler(
          new Response(cacheResponse, {
            headers: {
              'content-type': 'application/json',
            },
          }),
          false,
          store.proxyProvider,
          undefined,
          urlToFetch,
          false,
          store.reqBody,
          false
        );
        c.set('requestOptions', [
          {
            providerOptions: {
              ...store.reqBody,
              provider: store.proxyProvider,
              requestURL: urlToFetch,
              rubeusURL: 'proxy',
            },
            requestParams: store.reqBody,
            response: cacheMappedResponse.clone(),
            cacheStatus: cacheStatus,
            cacheKey: cacheKey,
            cacheMode: cacheMode,
            cacheMaxAge: cacheMaxAge,
          },
        ]);
        updateResponseHeaders(
          cacheMappedResponse,
          0,
          store.reqBody,
          cacheStatus,
          0,
          requestHeaders[HEADER_KEYS.TRACE_ID] ?? ''
        );
        return cacheMappedResponse;
      }
    }

    // Make the API call to the provider
    let [lastResponse, lastAttempt] = await retryRequest(
      urlToFetch,
      fetchOptions,
      retryCount,
      retryStatusCodes,
      null
    );
    const { response: mappedResponse } = await responseHandler(
      lastResponse,
      store.isStreamingMode,
      store.proxyProvider,
      undefined,
      urlToFetch,
      false,
      store.reqBody,
      false
    );
    updateResponseHeaders(
      mappedResponse,
      0,
      store.reqBody,
      cacheStatus,
      lastAttempt ?? 0,
      requestHeaders[HEADER_KEYS.TRACE_ID] ?? ''
    );

    c.set('requestOptions', [
      {
        providerOptions: {
          ...store.reqBody,
          provider: store.proxyProvider,
          requestURL: urlToFetch,
          rubeusURL: 'proxy',
        },
        requestParams: store.reqBody,
        response: mappedResponse.clone(),
        cacheStatus: cacheStatus,
        cacheKey: cacheKey,
        cacheMode: cacheMode,
        cacheMaxAge: cacheMaxAge,
      },
    ]);

    return mappedResponse;
  } catch (err: any) {
    console.log('proxy error', err.message);
    return new Response(
      JSON.stringify({
        status: 'failure',
        message: 'Something went wrong',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }
}
