import type { ConnectionOptions } from "node:tls";

/**
 * DATABASE_SSL: "disable" | "require" | "no-verify".
 * Unset uses the legacy API/worker behavior: disabled in development,
 * otherwise TLS without certificate verification.
 */
export function getSslConfig(): false | ConnectionOptions {
  const mode = process.env.DATABASE_SSL?.toLowerCase();
  if (mode === "disable" || mode === "false") return false;
  if (mode === "require") return { rejectUnauthorized: true };
  if (mode === "no-verify") return { rejectUnauthorized: false };
  return process.env.NODE_ENV === "development"
    ? false
    : { rejectUnauthorized: false };
}
