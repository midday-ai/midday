export function parseInputValue(value?: string | object | null) {
  if (value === null) return null;
  if (value === undefined) return undefined;

  // If it's already an object, return as-is (e.g., from form context)
  if (typeof value === "object") return value;

  // If it's an empty string, return undefined (matches original falsy behavior)
  if (value === "") return undefined;

  // If it's a string, parse it as JSON
  return JSON.parse(value);
}
