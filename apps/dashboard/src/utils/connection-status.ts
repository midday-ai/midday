import { differenceInDays } from "date-fns";

const WARNING_DAYS = 14;
const ERROR_DAYS = 7;
const DISPLAY_DAYS = 60;

type Connection = {
  expires_at: string | null;
};

export function getConnectionStatus(connections: Connection[] | null) {
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

  const show = connections?.some(
    (connection) =>
      connection.expires_at &&
      differenceInDays(new Date(connection.expires_at), new Date()) <=
        DISPLAY_DAYS,
  );

  return {
    warning,
    error,
    show,
  };
}
