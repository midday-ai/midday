/**
 * Sanitise a user-supplied redirect path to prevent open-redirect attacks.
 *
 * Only allows paths that start with a single "/" (root-relative paths).
 * Rejects protocol-relative URLs ("//evil.com"), absolute URLs with schemes,
 * and any other value that could redirect off-origin.
 *
 * Returns `fallback` (default "/") when the input is unsafe.
 */
export function sanitizeRedirectPath(raw: string, fallback = "/"): string {
  let decoded: string;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  // Must start with exactly one "/" — reject "//…", scheme:…, or relative paths
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  // Extra safety: resolve against a dummy base and verify the origin is unchanged
  try {
    const base = "https://localhost";
    const resolved = new URL(decoded, base);

    if (resolved.origin !== base) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return decoded;
}
