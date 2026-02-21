const RETRYABLE_ERRORS = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_SOCKET",
]);
const MAX_RETRIES = 2;

/**
 * Fetch wrapper that retries on transient connection errors (e.g. ECONNRESET
 * after the API service redeploys while the dashboard keeps stale keep-alive
 * connections to the old instances via Railway internal networking).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      lastError = err;
      const code = err?.cause?.code ?? err?.code ?? "";
      if (!RETRYABLE_ERRORS.has(code) || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  throw lastError;
}
