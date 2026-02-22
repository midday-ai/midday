const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_SOCKET",
]);

const RETRYABLE_NAMES = new Set(["TimeoutError"]);

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
 * Fetch wrapper for service-to-service calls over Railway private networking.
 *
 * Solves two known Railway issues during API redeployments:
 *
 * 1. Stale TCP connections — Bun's HTTP client pools keep-alive connections.
 *    When the API redeploys with a new internal IP, pooled connections point
 *    at dead containers and hang indefinitely. `Connection: close` forces a
 *    fresh TCP connection (and DNS resolution) per request, similar to how
 *    Caddy handles this (Railway's recommended approach).
 *
 * 2. Hanging requests — Even with fresh connections, DNS propagation on
 *    Railway's Wireguard mesh can lag. The 5s timeout ensures we fail fast
 *    instead of blocking the caller, and the retry with exponential backoff
 *    gives the mesh time to converge.
 */
export async function fetchWithRetry(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeout = AbortSignal.timeout(TIMEOUT_MS);
      const signal = init?.signal
        ? AbortSignal.any([init.signal, timeout])
        : timeout;
      const headers = new Headers(init?.headers);
      headers.set("Connection", "close");

      return await fetch(input, { ...init, signal, headers });
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw lastError;
}
