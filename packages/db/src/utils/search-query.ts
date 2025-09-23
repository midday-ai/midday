export const buildSearchQuery = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(/\s+/)
    .map((term) => {
      // Escape special characters for PostgreSQL full-text search
      // Special characters: & | ! ( ) : * ' " + - ~
      const escaped = term.toLowerCase().replace(/[&|!():*'"+~-]/g, "\\$&");
      return `${escaped}:*`;
    })
    .join(" & ");
};
