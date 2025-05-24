export function parseInputValue(value?: string | null) {
  if (value === null) return null;
  return value ? JSON.parse(value) : undefined;
}
