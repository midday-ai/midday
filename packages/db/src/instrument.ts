import { createLoggerWithContext } from "@midday/logger";
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";

const perfLogger = createLoggerWithContext("perf:db");

const OP_PATTERN = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i;
const TABLE_PATTERN = /\bFROM\s+"?(\w+)"?|INTO\s+"?(\w+)"?|UPDATE\s+"?(\w+)"?/i;

function parseQuery(sql: string | undefined) {
  if (!sql) return { operation: "unknown", table: "unknown" };
  const opMatch = sql.match(OP_PATTERN);
  const operation = opMatch ? opMatch[1]!.toUpperCase() : "unknown";
  const tableMatch = sql.match(TABLE_PATTERN);
  const table = tableMatch
    ? (tableMatch[1] ?? tableMatch[2] ?? tableMatch[3] ?? "unknown")
    : "unknown";
  return { operation, table };
}

function truncateSql(sql: string, max = 200): string {
  if (sql.length <= max) return sql;
  return `${sql.slice(0, max)}…`;
}

export function createDrizzleLogger(): DrizzleLogger {
  return {
    logQuery(query: string, params: unknown[]) {
      const { operation, table } = parseQuery(query);
      perfLogger.info(`${operation} ${table}`, {
        operation,
        table,
        paramCount: params.length,
        sql: truncateSql(query),
      });
    },
  };
}
