import { HookEventType, PluginContext } from './types';

interface PostOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ErrorResponse {
  status: number;
  statusText: string;
  body: string;
}

class HttpError extends Error {
  response: ErrorResponse;

  constructor(message: string, response: ErrorResponse) {
    super(message);
    this.name = 'HttpError';
    this.response = response;
  }
}

class TimeoutError extends Error {
  url: string;
  timeout: number;
  method: string;

  constructor(message: string, url: string, timeout: number, method: string) {
    super(message);
    this.name = 'TimeoutError';
    this.url = url;
    this.timeout = timeout;
    this.method = method;
  }
}

export const getText = (
  context: PluginContext,
  eventType: HookEventType
): string => {
  switch (eventType) {
    case 'beforeRequestHook':
      return context.request?.text;
    case 'afterRequestHook':
      return context.response?.text;
    default:
      throw new Error('Invalid hook type');
  }
};

/**
 * Sends a POST request to the specified URL with the given data and timeout.
 * @param url - The URL to send the POST request to.
 * @param data - The data to be sent in the request body.
 * @param options - Additional options for the fetch call.
 * @param timeout - Timeout in milliseconds (default: 5 seconds).
 * @returns A promise that resolves to the JSON response.
 * @throws {HttpError} Throws an HttpError with detailed information if the request fails.
 * @throws {Error} Throws a generic Error for network issues or timeouts.
 */
export async function post<T = any>(
  url: string,
  data: any,
  options: PostOptions = {},
  timeout: number = 5000
): Promise<T> {
  const defaultOptions: PostOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const mergedOptions: PostOptions = { ...defaultOptions, ...options };

  if (mergedOptions.headers) {
    mergedOptions.headers = {
      ...defaultOptions.headers,
      ...mergedOptions.headers,
    };
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response: Response = await fetch(url, {
      ...mergedOptions,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch (e) {
        errorBody = 'Unable to retrieve response body';
      }

      const errorResponse: ErrorResponse = {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      };

      throw new HttpError(
        `HTTP error! status: ${response.status}`,
        errorResponse
      );
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new TimeoutError(
        `Request timed out after ${timeout}ms`,
        url,
        timeout,
        mergedOptions.method || 'POST'
      );
    }
    // console.error('Error in post request:', error);
    throw error;
  }
}
