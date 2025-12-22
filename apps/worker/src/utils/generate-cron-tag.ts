/**
 * Generate a deterministic cron pattern based on an ID
 * Used to distribute load across different times
 */

export function generateCronTag(id: string): string {
  // Use id to generate a deterministic random minute and hour
  const hash = Array.from(id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  // Generate minute (0-59) and hour (0-23) based on hash
  const minute = hash % 60;
  const hour = hash % 24;

  // Return cron expression that runs daily at the generated time
  // Format: minute hour * * *
  return `${minute} ${hour} * * *`;
}

export function generateQuarterDailyCronTag(id: string): string {
  // Use id to generate a deterministic random minute
  const hash = Array.from(id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  // Generate minute (0-59) for consistency across all quarter-daily intervals
  const minute = hash % 60;

  // Return cron expression that runs every quarter day (6 hours) at the same minute
  // Format: minute */6 * * * (runs at 00:XX, 06:XX, 12:XX, 18:XX)
  return `${minute} */6 * * *`;
}

/**
 * Generate a deterministic cron pattern with an hour offset
 * Used to spread load across different times and avoid running at same time as other jobs
 *
 * @param id - The ID to generate the cron pattern from (e.g., teamId)
 * @param offsetHours - Number of hours to offset from the base time
 * @returns Cron expression (e.g., "45 20 * * *" for 8:45 PM)
 *
 * @example
 * // If generateCronTag(teamId) returns "45 14 * * *" (2:45 PM)
 * // generateOffsetCronTag(teamId, 6) returns "45 20 * * *" (8:45 PM)
 */
export function generateOffsetCronTag(id: string, offsetHours: number): string {
  const hash = Array.from(id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  // Generate minute (0-59) and hour (0-23) based on hash
  const minute = hash % 60;
  const hour = (hash + offsetHours) % 24; // Add offset and wrap around

  // Return cron expression that runs daily at the generated time
  // Format: minute hour * * *
  return `${minute} ${hour} * * *`;
}
