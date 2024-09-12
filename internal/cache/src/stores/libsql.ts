import type { Client } from "@libsql/client";

import { Ok, type Result } from "@solomon-ai/error";

import type { CacheError } from "../errors";
import type { Entry, Store } from "./interface";

export type LibsqlStoreConfig = {
  client: Client;
  tableName?: string;
};

export class LibSQLStore<TNamespace extends string, TValue = any>
  implements Store<TNamespace, TValue>
{
  private readonly tableName: string;
  private readonly client: Client;
  public readonly name = "libsql";

  constructor(config: LibsqlStoreConfig) {
    this.client = config.client;
    this.tableName = config.tableName || "cache";
  }

  private buildCacheKey(namespace: TNamespace, key: string): string {
    return `${namespace}::${key}`;
  }

  public async get(
    namespace: TNamespace,
    key: string,
  ): Promise<Result<Entry<TValue> | undefined, CacheError>> {
    try {
      const result = await this.client.execute({
        sql: `SELECT value, freshUntil, staleUntil FROM ${this.tableName} WHERE key = ?`,
        args: [this.buildCacheKey(namespace, key)],
      });

      if (result.rows.length === 0) {
        return Ok(undefined);
      }

      const row = result.rows[0];
      const entry: Entry<TValue> = {
        value: JSON.parse(row.value as string),
        freshUntil: Number(row.freshUntil),
        staleUntil: Number(row.staleUntil),
      };

      return Ok(entry);
    } catch {
      return Ok(undefined);
    }
  }

  public async set(
    namespace: TNamespace,
    key: string,
    entry: Entry<TValue>,
  ): Promise<Result<void, CacheError>> {
    try {
      await this.client.execute({
        sql: `INSERT OR REPLACE INTO ${this.tableName} (key, value, freshUntil, staleUntil)
              VALUES (?, ?, ?, ?)`,
        args: [
          this.buildCacheKey(namespace, key),
          JSON.stringify(entry.value),
          entry.freshUntil,
          entry.staleUntil,
        ],
      });

      return Ok();
    } catch {
      return Ok();
    }
  }

  public async remove(
    namespace: TNamespace,
    keys: string | string[],
  ): Promise<Result<void, CacheError>> {
    const cacheKeys = (Array.isArray(keys) ? keys : [keys]).map((key) =>
      this.buildCacheKey(namespace, key).toString(),
    );

    try {
      await Promise.all(
        cacheKeys.map((cacheKey) =>
          this.client.execute({
            sql: `DELETE FROM ${this.tableName} WHERE key = ?`,
            args: [cacheKey],
          }),
        ),
      );

      return Ok();
    } catch {
      return Ok();
    }
  }
}
