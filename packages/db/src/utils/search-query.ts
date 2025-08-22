export const buildSearchQuery = (input: string) => {
  return input
    .trim()
    .split(/\s+/)
    .map((term) => `${term.toLowerCase()}:*`)
    .join(" & ");
};
