import type { App } from "../../../src/pkg/hono/app";
export type StepRequest<TRequestBody> = {
  url: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: TRequestBody;
};
export type StepResponse<TBody = unknown> = {
  status: number;
  headers: Record<string, string>;
  body: TBody;
};

export async function step<TRequestBody = unknown, TResponseBody = unknown>(
  req: StepRequest<TRequestBody>,
): Promise<StepResponse<TResponseBody>> {
  const res = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
  });

  const body = await res.text();
  try {
    return {
      status: res.status,
      headers: headersToRecord(res.headers as unknown as Headers),
      body: JSON.parse(body),
    };
  } catch {
    console.error(`${req.url} didn't return json, received: ${body}`);
    return {} as StepResponse<TResponseBody>;
  }
}

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
    abort: (_reason?: any) => {},
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

export function headersToRecord(headers: Headers): Record<string, string> {
  const rec: Record<string, string> = {};
  headers.forEach((v, k) => {
    rec[k] = v;
  });
  return rec;
}
