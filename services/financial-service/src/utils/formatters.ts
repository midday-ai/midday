/**
 * Formats the platform prefix by replacing underscores with hyphens and removing any trailing hyphens.
 *
 * @param {string} prefix - The original platform prefix to be formatted.
 * @returns {string} The formatted platform prefix.
 */
export function formatPlatformPrefix(prefix: string): string {
  return prefix.replace(/_/g, "-").replace(/-$/, "");
}
