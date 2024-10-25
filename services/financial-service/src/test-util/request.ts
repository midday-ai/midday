import { App } from "@/hono/app";
import { SELF } from "cloudflare:test";

/**
 * Defines the structure of a request used in the `step` function, which represents an HTTP request.
 *
 * @template TRequestBody - The expected type of the request body.
 *
 * @property {string} url - The URL to which the request will be sent.
 * @property {"POST" | "GET" | "PUT" | "DELETE"} method - The HTTP method used for the request.
 * @property {Record<string, string>=} headers - Optional headers to include in the request.
 * @property {TRequestBody=} body - The request body, if applicable, matching the provided request body type.
 */
export type StepRequest<TRequestBody> = {
  url: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: TRequestBody;
};

/**
 * Defines the structure of a response returned by the `step` and `fetchRoute` functions.
 *
 * @template TBody - The expected type of the response body.
 *
 * @property {number} status - The HTTP status code of the response.
 * @property {Record<string, string>} headers - The headers included in the response.
 * @property {TBody} body - The body of the response, matching the provided response body type.
 */
export type StepResponse<TBody = unknown> = {
  status: number;
  headers: Record<string, string>;
  body: TBody;
};

/**
 * Executes an HTTP request using the provided `StepRequest` configuration and returns a `StepResponse`.
 * The function handles making the request and parsing the response, expecting the response to be JSON.
 *
 * @template TRequestBody - The type of the request body.
 * @template TResponseBody - The type of the response body.
 *
 * @param {StepRequest<TRequestBody>} req - The configuration for the HTTP request, including URL, method, headers, and body.
 * @returns {Promise<StepResponse<TResponseBody>>} - A promise that resolves with the response of the request.
 *
 * @example
 * ```typescript
 * const response = await step({
 *   url: "https://example.com/api",
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: { key: "value" },
 * });
 * console.log(response.status); // 200
 * console.log(response.body); // Parsed JSON response
 * ```
 */
export async function step<TRequestBody = unknown, TResponseBody = unknown>(
  req: StepRequest<TRequestBody>,
): Promise<StepResponse<TResponseBody>> {
  const res = await SELF.fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
  });

  const body = await res.text();
  try {
    return {
      status: res.status,
      headers: headersToRecord(res.headers as any),
      body: JSON.parse(body),
    };
  } catch {
    console.error(`${req.url} didn't return json, received: ${body}`);
    return {} as StepResponse<TResponseBody>;
  }
}

/**
 * Executes an HTTP request on the provided Hono `App` using the given `StepRequest`.
 * This function simulates making a request within the context of the application environment and returns the response.
 *
 * @template TRequestBody - The type of the request body.
 * @template TResponseBody - The type of the response body.
 *
 * @param {App} app - The Hono application instance where the request will be routed.
 * @param {StepRequest<TRequestBody>} req - The configuration for the HTTP request, including URL, method, headers, and body.
 * @returns {Promise<StepResponse<TResponseBody>>} - A promise that resolves with the response of the simulated request.
 *
 * @example
 * ```typescript
 * const app = new App();
 * const response = await fetchRoute(app, {
 *   url: "/api/resource",
 *   method: "GET",
 * });
 * console.log(response.status); // 200
 * console.log(response.body); // Parsed JSON response
 * ```
 */
export async function fetchRoute<
  TRequestBody = unknown,
  TResponseBody = unknown,
>(
  app: App,
  req: StepRequest<TRequestBody>,
): Promise<StepResponse<TResponseBody>> {
  const eCtx: ExecutionContext = {
    waitUntil: (promise: Promise<any>) => {
      promise.catch(() => {});
    },
    passThroughOnException: () => {},
  };

  const res = await app.request(
    req.url,
    {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
    },
    {}, // Env
    eCtx,
  );

  return {
    status: res.status,
    headers: headersToRecord(res.headers),
    body: (await res.json().catch((err) => {
      console.error(`${req.url} didn't return json`, err);
      return {};
    })) as TResponseBody,
  };
}

/**
 * Converts the `Headers` object from an HTTP response to a plain `Record<string, string>` format.
 *
 * @param {Headers} headers - The headers object to convert.
 * @returns {Record<string, string>} - A plain object representing the headers as key-value pairs.
 *
 * @example
 * ```typescript
 * const headers = new Headers();
 * headers.append("Content-Type", "application/json");
 * const headerRecord = headersToRecord(headers);
 * console.log(headerRecord); // { "Content-Type": "application/json" }
 * ```
 */
export function headersToRecord(headers: Headers): Record<string, string> {
  const rec: Record<string, string> = {};
  headers.forEach((v, k) => {
    rec[k] = v;
  });
  return rec;
}
