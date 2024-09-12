/**
 * Options for generating a random date.
 */
interface RandomDateOptions {
  start?: Date;
  end?: Date;
  inclusiveEnd?: boolean;
}

/**
 * Generates a random date within a specified range.
 *
 * @param options - Configuration options for date generation
 * @returns A random Date object
 *
 * @example
 * // Generate a random date in the year 2023
 * const randomDate = generateRandomDate({
 *   start: new Date(2023, 0, 1),
 *   end: new Date(2023, 11, 31)
 * });
 *
 * @example
 * // Generate a random date in the last 30 days
 * const randomRecentDate = generateRandomDate({
 *   start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
 *   end: new Date(),
 *   inclusiveEnd: true
 * });
 */
export function generateRandomDate(options: RandomDateOptions = {}): Date {
  const {
    start = new Date(1970, 0, 1),
    end = new Date(),
    inclusiveEnd = false,
  } = options;

  if (start > end) {
    throw new Error("Start date must be before end date");
  }

  const startTime = start.getTime();
  const endTime = inclusiveEnd ? end.getTime() + 86400000 : end.getTime(); // Add a day if inclusive
  const randomTime = startTime + Math.random() * (endTime - startTime);

  return new Date(randomTime);
}

/**
 * Formats a date to ISO 8601 format (YYYY-MM-DD).
 *
 * @param date - The date to format
 * @returns A string representation of the date in YYYY-MM-DD format
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split("T")[0] || "";
}

// Example usage:
// const randomDate = generateRandomDate({
//   start: new Date(2020, 0, 1),
//   end: new Date(2023, 11, 31),
//   inclusiveEnd: true
// });
// console.log(formatDateToISO(randomDate));
