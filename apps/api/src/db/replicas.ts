import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { TablesRelationalConfig } from "drizzle-orm/relations";

export type ReplicatedDatabase<Q extends PgDatabase<any, any, any>> = Q & {
  executeOnReplica: Q["execute"];
  transactionOnReplica: Q["transaction"];
};

export const withReplicas = <
  HKT extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
  Q extends PgDatabase<
    HKT,
    TFullSchema,
    TSchema extends Record<string, unknown>
      ? ExtractTablesWithRelations<TFullSchema>
      : TSchema
  >,
>(
  primary: Q,
  replicas: [Q, ...Q[]],
  getReplica: (replicas: Q[]) => Q = () =>
    replicas[Math.floor(Math.random() * replicas.length)]!,
): ReplicatedDatabase<Q> => {
  const select: Q["select"] = (...args: []) =>
    getReplica(replicas).select(...args);
  const selectDistinct: Q["selectDistinct"] = (...args: []) =>
    getReplica(replicas).selectDistinct(...args);
  const selectDistinctOn: Q["selectDistinctOn"] = (...args: [any]) =>
    getReplica(replicas).selectDistinctOn(...args);
  const $count: Q["$count"] = (...args: [any]) =>
    getReplica(replicas).$count(...args);
  const _with: Q["with"] = (...args: any) => getReplica(replicas).with(...args);
  const $with: Q["$with"] = (arg: any) =>
    getReplica(replicas).$with(arg) as any;

  const executeOnReplica: Q["execute"] = (...args: [any]) =>
    getReplica(replicas).execute(...args);
  const transactionOnReplica: Q["transaction"] = (...args: [any]) =>
    getReplica(replicas).transaction(...args);

  const update: Q["update"] = (...args: [any]) => primary.update(...args);
  const insert: Q["insert"] = (...args: [any]) => primary.insert(...args);
  const $delete: Q["delete"] = (...args: [any]) => primary.delete(...args);
  const execute: Q["execute"] = (...args: [any]) => primary.execute(...args);
  const transaction: Q["transaction"] = (...args: [any]) =>
    primary.transaction(...args);
  const refreshMaterializedView: Q["refreshMaterializedView"] = (
    ...args: [any]
  ) => primary.refreshMaterializedView(...args);

  return {
    ...primary,
    update,
    insert,
    delete: $delete,
    execute,
    transaction,
    executeOnReplica,
    transactionOnReplica,
    refreshMaterializedView,
    $primary: primary,
    select,
    selectDistinct,
    selectDistinctOn,
    $count,
    $with,
    with: _with,
    get query() {
      return getReplica(replicas).query;
    },
  };
};
