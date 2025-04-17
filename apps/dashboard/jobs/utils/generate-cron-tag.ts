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

  // Generate minute (0-59) based on hash
  const minute = hash % 60;

  // Return cron expression that runs every 6 hours at the generated minute
  // Format: minute 0,6,12,18 * * *
  return `${minute} 0,6,12,18 * * *`;
}
