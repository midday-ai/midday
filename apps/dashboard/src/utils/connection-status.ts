import type { RouterOutputs } from "@api/trpc/routers/_app";
import { differenceInDays } from "date-fns";

const DISPLAY_DAYS = 30;
const WARNING_DAYS = 14;
const ERROR_DAYS = 7;

type Connection = NonNullable<RouterOutputs["bankConnections"]["get"]>[number];

export function getConnectionsStatus(connections: Connection[]) {
  const warning = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
        WARNING_DAYS,
  );

  const error = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
        ERROR_DAYS,
  );

  const expired = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <= 0,
  );

  const show = connections?.some(
    (connection) =>
      connection.expiresAt &&
      differenceInDays(new Date(connection.expiresAt), new Date()) <=
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
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <=
      WARNING_DAYS;

  const error =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <= ERROR_DAYS;

  const expired =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <= 0;

  const show =
    connection.expiresAt &&
    differenceInDays(new Date(connection.expiresAt), new Date()) <=
      DISPLAY_DAYS;

  return {
    warning,
    error,
    expired,
    show,
  };
}
