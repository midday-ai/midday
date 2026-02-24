import { createLoggerWithContext } from "@midday/logger";
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import type { Pool } from "pg";

const perfLogger = createLoggerWithContext("perf:db");

const SLOW_QUERY_MS = 100;
const VERY_SLOW_QUERY_MS = 500;

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

export function instrumentPool(pool: Pool, label: string): void {
  const origQuery = pool.query.bind(pool);

  (pool as unknown as Record<string, unknown>).query = (
    ...args: unknown[]
  ): unknown => {
    const start = performance.now();
    const result = (origQuery as (...a: unknown[]) => unknown)(...args);
    if (result && typeof (result as any).then === "function") {
      (result as Promise<unknown>).then(
        () => {
          const ms = performance.now() - start;
          if (ms > SLOW_QUERY_MS) {
            const sql =
              typeof args[0] === "string"
                ? args[0]
                : (args[0] as { text?: string } | undefined)?.text;
            const { operation, table } = parseQuery(sql);
            const data = {
              durationMs: +ms.toFixed(2),
              operation,
              table,
              pool: label,
              sql: sql ? truncateSql(sql) : undefined,
            };

            if (ms > VERY_SLOW_QUERY_MS) {
              perfLogger.error(
                `${operation} ${table} took ${ms.toFixed(0)}ms`,
                data,
              );
            } else {
              perfLogger.warn(
                `${operation} ${table} took ${ms.toFixed(0)}ms`,
                data,
              );
            }
          }
        },
        () => {},
      );
    }
    return result;
  };
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
