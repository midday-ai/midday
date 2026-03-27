import { getToken } from "../config/store.js";
import { getApiUrl } from "../utils/env.js";
import { APIError, AuthRequiredError } from "../utils/errors.js";

interface RequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  apiUrl?: string;
  debug?: boolean;
}

interface APIResponse<T = unknown> {
  data: T;
  status: number;
}

export async function request<T = unknown>(
  opts: RequestOptions,
): Promise<APIResponse<T>> {
  const token = getToken();
  if (!token) throw new AuthRequiredError();

  const baseUrl = opts.apiUrl || getApiUrl();
  const url = new URL(opts.path, baseUrl);

  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "midday-cli/0.1.0",
  };

  if (opts.debug) {
    console.error(`[debug] ${opts.method || "GET"} ${url.toString()}`);
    if (opts.body) {
      console.error(`[debug] body: ${JSON.stringify(opts.body)}`);
    }
  }

  const response = await fetch(url.toString(), {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (opts.debug) {
    console.error(`[debug] ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorCode = `http_${response.status}`;

    try {
      const errorBody = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
      };
      errorMessage = errorBody.message || errorBody.error || errorMessage;
      if (errorBody.code) errorCode = errorBody.code;
    } catch {
      // Use status text
    }

    throw new APIError(response.status, errorCode, errorMessage);
  }

  if (response.status === 204) {
    return { data: null as T, status: 204 };
  }

  const data = (await response.json()) as T;
  return { data, status: response.status };
}

export async function get<T = unknown>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  opts?: { apiUrl?: string; debug?: boolean },
): Promise<T> {
  const res = await request<T>({ path, query, ...opts });
  return res.data;
}

export async function post<T = unknown>(
  path: string,
  body?: unknown,
  opts?: { apiUrl?: string; debug?: boolean },
): Promise<T> {
  const res = await request<T>({ method: "POST", path, body, ...opts });
  return res.data;
}

export async function put<T = unknown>(
  path: string,
  body?: unknown,
  opts?: { apiUrl?: string; debug?: boolean },
): Promise<T> {
  const res = await request<T>({ method: "PUT", path, body, ...opts });
  return res.data;
}

export async function del<T = unknown>(
  path: string,
  opts?: { apiUrl?: string; debug?: boolean },
): Promise<T> {
  const res = await request<T>({ method: "DELETE", path, ...opts });
  return res.data;
}
