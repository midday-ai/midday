const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_SOCKET",
]);

const RETRYABLE_NAMES = new Set(["TimeoutError"]);

const MAX_RETRIES = 1;
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
 * During API redeployments, DNS propagation on Railway's Wireguard mesh can
 * lag and pooled keep-alive connections may point at dead containers. The 5s
 * timeout ensures we fail fast instead of hanging, and the retry with
 * exponential backoff gives the mesh time to converge.
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

      return await fetch(input, { ...init, signal });
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw lastError;
}
