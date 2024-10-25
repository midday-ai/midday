/**
 * Filters an array of strings based on a wildcard pattern.
 *
 * @param resources - An array of strings to be filtered.
 * @param pattern - A wildcard pattern string. The '*' character matches any sequence of characters.
 * @returns An array of strings that match the given wildcard pattern.
 *
 * @example
 * const files = ['file1.txt', 'file2.jpg', 'document.pdf'];
 * const filtered = filter(files, '*.txt');
 * console.log(filtered); // ['file1.txt']
 */
export function filter(resources: string[], pattern: string): string[] {
  // Replace '*' with a regular expression pattern that matches any sequence of characters
  const regexPattern = pattern
    .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);

  // Filter the strings that match the regular expression
  return resources.filter((str) => regex.test(str));
}

/**
 * Checks if a given string matches a wildcard pattern.
 *
 * @param pattern - A wildcard pattern string. The '*' character matches any sequence of characters.
 * @param str - The string to be matched against the pattern.
 * @returns A boolean indicating whether the string matches the pattern.
 *
 * @example
 * console.log(match('file*.txt', 'file1.txt')); // true
 * console.log(match('doc*.pdf', 'document.txt')); // false
 */
export function match(pattern: string, str: string): boolean {
  // Replace '*' with a regular expression pattern that matches any sequence of characters
  const regexPattern = pattern
    .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);

  return regex.test(str);
}
