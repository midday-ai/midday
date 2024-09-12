import { Context } from 'hono';
import { retryRequest } from './retryHandler';
import Providers from '../providers';
import {
  ANTHROPIC,
  MAX_RETRIES,
  HEADER_KEYS,
  RETRY_STATUS_CODES,
  POWERED_BY,
  AZURE_OPEN_AI,
} from '../globals';
import { updateResponseHeaders } from './handlerUtils';
import { env } from 'hono/adapter';
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
  let proxyPath = `${providerBasePath}${reqPath}${reqQuery}`;

  // Fix specific for Anthropic SDK calls. Is this needed? - Yes
  if (proxyProvider === ANTHROPIC) {
    proxyPath = proxyPath.replace('/v1/v1/', '/v1/');
  }

  return proxyPath;
}

function headersToSend(
  headersObj: Record<string, string>,
  customHeadersToIgnore: Array<string>
): Record<string, string> {
  let final: Record<string, string> = {};
  const poweredByHeadersPattern = `x-${POWERED_BY}-`;
  const headersToAvoid = [...customHeadersToIgnore];
  headersToAvoid.push('content-length');
  Object.keys(headersObj).forEach((key: string) => {
    if (
      !headersToAvoid.includes(key) &&
      !key.startsWith(poweredByHeadersPattern)
    ) {
      final[key] = headersObj[key];
    }
  });
  final['accept-encoding'] = 'gzip, deflate';
  return final;
}

export async function proxyGetHandler(c: Context): Promise<Response> {
  try {
    const requestHeaders = Object.fromEntries(c.req.raw.headers);
    delete requestHeaders['content-type'];
    const store: Record<string, any> = {
      proxyProvider: proxyProvider(
        requestHeaders[HEADER_KEYS.MODE],
        requestHeaders[HEADER_KEYS.PROVIDER]
      ),
      customHeadersToAvoid: env(c).CUSTOM_HEADERS_TO_IGNORE ?? [],
      reqBody: {},
      proxyPath: c.req.url.indexOf('/v1/proxy') > -1 ? '/v1/proxy' : '/v1',
    };

    const customHost = requestHeaders[HEADER_KEYS.CUSTOM_HOST] || '';

    let urlToFetch = getProxyPath(
      c.req.url,
      store.proxyProvider,
      store.proxyPath,
      customHost
    );

    let fetchOptions = {
      headers: headersToSend(requestHeaders, store.customHeadersToAvoid),
      method: c.req.method,
    };

    let retryCount = Math.min(
      parseInt(requestHeaders[HEADER_KEYS.RETRIES]) || 1,
      MAX_RETRIES
    );

    let [lastResponse, lastAttempt] = await retryRequest(
      urlToFetch,
      fetchOptions,
      retryCount,
      RETRY_STATUS_CODES,
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
      'DISABLED',
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
        cacheStatus: 'DISABLED',
        cacheKey: undefined,
      },
    ]);

    return mappedResponse;
  } catch (err: any) {
    console.log('proxyGet error', err.message);
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
