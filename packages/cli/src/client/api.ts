import { getToken } from "../config/store.js";
import { getApiUrl } from "../utils/env.js";
import { APIError, AuthRequiredError } from "../utils/errors.js";

type QueryValue = string | number | boolean | string[] | undefined;

interface RequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
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
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v);
        }
      } else {
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
    let hint: string | undefined;

    try {
      const raw = await response.json();
      const parsed = parseAPIError(raw, opts.path);
      errorMessage = parsed.message;
      hint = parsed.hint;
      if (parsed.code) errorCode = parsed.code;
    } catch {
      // Use status text
    }

    throw new APIError(response.status, errorCode, errorMessage, hint);
  }

  if (response.status === 204) {
    return { data: null as T, status: 204 };
  }

  const data = (await response.json()) as T;
  return { data, status: response.status };
}

export async function get<T = unknown>(
  path: string,
  query?: Record<string, QueryValue>,
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

interface ZodIssue {
  path?: (string | number)[];
  message?: string;
  expected?: string;
  code?: string;
}

const FLAG_HINTS: Record<string, string> = {
  from: "--from <YYYY-MM-DD>",
  to: "--to <YYYY-MM-DD>",
  start: "--from <YYYY-MM-DD>",
  end: "--to <YYYY-MM-DD>",
  currency: "--currency <code>",
  pageSize: "--page-size <n>",
  status: "--status <value>",
  customerId: "--customer <id>",
  name: "--name <value>",
  amount: "--amount <number>",
  bankAccountId: "--account <id>",
  projectId: "--project <id>",
  q: "--search <query>",
};

function parseAPIError(
  body: unknown,
  path: string,
): { message: string; hint?: string; code?: string } {
  // Zod validation array: [{ path: ["from"], message: "..." }, ...]
  if (Array.isArray(body)) {
    return parseZodIssues(body as ZodIssue[], path);
  }

  if (!body || typeof body !== "object") {
    return { message: String(body) };
  }

  const obj = body as Record<string, unknown>;

  // { success: false, error: { name: "ZodError", message: "[...]" } }
  if (obj.error && typeof obj.error === "object") {
    const err = obj.error as Record<string, unknown>;
    if (err.name === "ZodError" && typeof err.message === "string") {
      try {
        const issues = JSON.parse(err.message) as ZodIssue[];
        if (Array.isArray(issues)) {
          return parseZodIssues(issues, path);
        }
      } catch {
        // fall through
      }
    }
    if (typeof err.message === "string") {
      return { message: err.message };
    }
  }

  if (typeof obj.message === "string") {
    return {
      message: obj.message,
      code: typeof obj.code === "string" ? obj.code : undefined,
    };
  }

  if (typeof obj.error === "string") {
    return { message: obj.error };
  }

  return { message: JSON.stringify(body) };
}

function parseZodIssues(
  issues: ZodIssue[],
  path: string,
): { message: string; hint?: string } {
  const missingFields: string[] = [];
  const messages: string[] = [];

  for (const issue of issues) {
    const field = issue.path?.join(".") || "unknown";
    if (issue.code === "invalid_type" && issue.message?.includes("undefined")) {
      missingFields.push(field);
    } else {
      messages.push(`${field}: ${issue.message || "invalid"}`);
    }
  }

  if (missingFields.length > 0) {
    const label =
      missingFields.length === 1
        ? `Missing required field: ${missingFields[0]}`
        : `Missing required fields: ${missingFields.join(", ")}`;

    const flags = missingFields.map((f) => FLAG_HINTS[f]).filter(Boolean);

    const command = path.replace(/^\//, "").replace(/\//g, " ");
    const hint =
      flags.length > 0
        ? `Try: midday ${command} ${flags.join(" ")}`
        : undefined;

    return { message: label, hint };
  }

  return { message: messages.join("; ") || "Validation failed" };
}
