const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_SOCKET",
]);

const RETRYABLE_NAMES = new Set(["AbortError", "TimeoutError"]);

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5_000;

function isRetryable(err: any): boolean {
  const code = err?.cause?.code ?? err?.code ?? "";
  if (RETRYABLE_CODES.has(code)) return true;

  const name = err?.name ?? "";
  if (RETRYABLE_NAMES.has(name)) return true;

  return false;
}

/**
 * Fetch wrapper that adds a timeout and retries on transient connection errors.
 *
 * When the API redeploys, the dashboard's Node.js process may hold stale
 * keep-alive connections via Railway internal networking. Without a timeout
 * these connections hang indefinitely (no error thrown), blocking all SSR.
 * The timeout ensures hanging connections fail fast so retries can establish
 * fresh connections to the new API instances.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const signal = init?.signal ?? AbortSignal.timeout(TIMEOUT_MS);
      return await fetch(input, { ...init, signal });
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw lastError;
}
