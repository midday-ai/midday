/** The input cannot be represented as a safe canonical object key. */
export class StorageKeyError extends Error {
  name = "StorageKeyError";
}
/** The key is outside the authenticated tenant's namespace. */
export class StorageForbiddenError extends Error {
  name = "StorageForbiddenError";
}

/**
 * Normalize transport-decoded keys once, without interpreting literal percent escapes.
 * Authorization, SDK requests, and database names must use this exact representation.
 */
export function normalizeKey(input: string | string[]): string {
  let key = Array.isArray(input) ? input.join("/") : input;
  if (key.startsWith("/")) key = key.slice(1);
  if (key.startsWith("vault/")) key = key.slice(6);
  // biome-ignore lint/suspicious/noControlCharactersInRegex: explicitly reject control bytes in object keys
  const hasUnsafeCharacters = /[\\\u0000-\u001f\u007f]/.test(key);
  if (
    key.startsWith("vault/") ||
    hasUnsafeCharacters ||
    key.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new StorageKeyError("Invalid storage key");
  }
  return key;
}

/** Return the canonical key only when its first segment is the verified team ID. */
export function assertTeamKey(
  teamId: string,
  input: string | string[],
): string {
  const key = normalizeKey(input);
  if (!teamId || key.split("/")[0] !== teamId) {
    throw new StorageForbiddenError("Storage key does not belong to this team");
  }
  return key;
}

/** Match the original document trigger's parent-folder identity. */
export function parentIdFromKey(input: string): string | null {
  const parts = normalizeKey(input).split("/");
  return parts.length > 1 ? parts.at(-2)! : null;
}

export { stripSpecialCharacters as sanitizeFilename } from "@midday/utils";
