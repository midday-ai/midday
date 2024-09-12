import {
  type ErrorContext,
  type FetchParams,
  type Middleware,
  type RequestContext,
  type ResponseContext,
} from "client-typescript-sdk";

import { Logger } from "./logger";

/**
 * Middleware that adds custom headers to outgoing requests.
 * @type {Middleware}
 */
export const addCustomHeaderMiddleware: Middleware = {
  /**
   * Executes before the request is sent.
   * @param {RequestContext} context - The request context.
   * @returns {Promise<FetchParams | void>} Modified fetch parameters or void.
   */
  pre: async (context: RequestContext): Promise<FetchParams | void> => {
    const customHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "no-referrer",
      "X-Platform": "SolomonAI",
      "X-Request-ID": generateRequestId(),
    };

    const modifiedInit: RequestInit = {
      ...context.init,
      headers: {
        ...context.init.headers,
        ...customHeaders,
      },
    };

    Logger.debug("Outgoing request", {
      url: context.url,
      method: context.init.method,
      headers: modifiedInit.headers,
    });

    return { url: context.url, init: modifiedInit };
  },
};

/**
 * Middleware that handles errors and logs responses.
 * @type {Middleware}
 */
export const errorHandlingMiddleware: Middleware = {
  /**
   * Executes after receiving a response.
   * @param {ResponseContext} context - The response context.
   * @returns {Promise<Response | void>} The response or void.
   * @throws {Error} If the response is not OK.
   */
  post: async (context: ResponseContext): Promise<Response | void> => {
    const { response } = context;

    Logger.debug("Received response", {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`HTTP error! status: ${response.status}`);

      Logger.error("API request failed", error, {
        url: response.url,
        status: response.status,
        body: errorBody,
      });

      throw error;
    }

    return response;
  },

  /**
   * Handles errors that occur during the request.
   * @param {ErrorContext} context - The error context.
   * @throws {Error} The caught error.
   */
  onError: async (context: ErrorContext): Promise<Response | void> => {
    const { error } = context;

    Logger.error("Network or other error occurred", error as Error);

    throw error;
  },
};

/**
 * Generates a unique request ID.
 * @returns {string} A unique request ID.
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
