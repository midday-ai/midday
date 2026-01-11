import timezones from "./timezones.json";

export function getTimezones() {
  return timezones;
}

/**
 * Validate that a timezone string is valid using Intl.DateTimeFormat.
 * This is more reliable than checking against a static list as it uses
 * the runtime's actual timezone database.
 *
 * @param tz - Timezone string to validate (e.g., 'America/New_York', 'UTC')
 * @returns true if valid IANA timezone, false otherwise
 */
export function isValidTimezone(tz: string): boolean {
  try {
    // Intl.DateTimeFormat will throw if the timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
