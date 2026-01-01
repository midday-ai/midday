export function parseInputValue(value?: string | object | null) {
  if (value === null) return null;
  if (value === undefined) return undefined;

  // If it's already an object, return as-is (e.g., from form context)
  if (typeof value === "object") return value;

  // If it's a string, parse it as JSON
  return JSON.parse(value);
}
