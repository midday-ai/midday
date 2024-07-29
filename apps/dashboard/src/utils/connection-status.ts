import { differenceInDays } from "date-fns";

const DISPLAY_DAYS = 30;
const WARNING_DAYS = 14;
const ERROR_DAYS = 7;

type Connection = {
  expires_at?: string | null;
};

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
