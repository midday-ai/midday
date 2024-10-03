import { differenceInDays } from "date-fns";

const DISPLAY_DAYS = 30;
const WARNING_DAYS = 14;
const ERROR_DAYS = 7;

/**
 * Represents a connection with an optional expiration date.
 */
type Connection = {
  /** The expiration date of the connection as an ISO string, or null if not set. */
  expires_at?: string | null;
};

/**
 * Calculates the status of multiple connections.
 *
 * @param connections - An array of Connection objects or null.
 * @returns An object containing boolean flags for different status conditions:
 *   - warning: True if any connection expires within the warning period.
 *   - expired: True if any connection has expired.
 *   - error: True if any connection expires within the error period.
 *   - show: True if any connection expires within the display period.
 */
export function getConnectionsStatus(connections: Connection[] | null) {
  const warning = connections?.some(
    (connection) =>
      connection.expires_at &&
      differenceInDays(new Date(connection.expires_at), new Date()) <=
        WARNING_DAYS,
  );

  const error = connections?.some(
    (connection) =>
      connection.expires_at &&
      differenceInDays(new Date(connection.expires_at), new Date()) <=
        ERROR_DAYS,
  );

  const expired = connections?.some(
    (connection) =>
      connection.expires_at &&
      differenceInDays(new Date(connection.expires_at), new Date()) <= 0,
  );

  const show = connections?.some(
    (connection) =>
      connection.expires_at &&
      differenceInDays(new Date(connection.expires_at), new Date()) <=
        DISPLAY_DAYS,
  );

  return {
    warning,
    expired,
    error,
    show,
  };
}

/**
 * Calculates the status of a single connection.
 *
 * @param connection - A Connection object to evaluate.
 * @returns An object containing boolean flags for different status conditions:
 *   - warning: True if the connection expires within the warning period.
 *   - error: True if the connection expires within the error period.
 *   - expired: True if the connection has expired.
 *   - show: True if the connection expires within the display period.
 */
export function connectionStatus(connection: Connection) {
  const warning =
    connection.expires_at &&
    differenceInDays(new Date(connection.expires_at), new Date()) <=
      WARNING_DAYS;

  const error =
    connection.expires_at &&
    differenceInDays(new Date(connection.expires_at), new Date()) <= ERROR_DAYS;

  const expired =
    connection.expires_at &&
    differenceInDays(new Date(connection.expires_at), new Date()) <= 0;

  const show =
    connection.expires_at &&
    differenceInDays(new Date(connection.expires_at), new Date()) <=
      DISPLAY_DAYS;

  return {
    warning,
    error,
    expired,
    show,
  };
}
