export function generateCronTag(teamId: string): string {
  // Use teamId to generate a deterministic random minute and hour
  const hash = Array.from(teamId).reduce(
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

export function generateQuarterDailyCronTag(teamId: string): string {
  // Use teamId to generate a deterministic random minute
  const hash = Array.from(teamId).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  // Generate minute (0-59) for consistency across all quarter-daily intervals
  const minute = hash % 60;

  // Return cron expression that runs every quarter day (6 hours) at the same minute
  // Format: minute */6 * * * (runs at 00:XX, 06:XX, 12:XX, 18:XX)
  return `${minute} */6 * * *`;
}
