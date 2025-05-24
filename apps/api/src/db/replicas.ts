import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { TablesRelationalConfig } from "drizzle-orm/relations";

export type ReplicatedDatabase<Q extends PgDatabase<any, any, any>> = Q & {
  executeOnReplica: Q["execute"];
  transactionOnReplica: Q["transaction"];
  usePrimaryOnly: () => ReplicatedDatabase<Q>;
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
  const createDatabase = (usePrimary = false): ReplicatedDatabase<Q> => {
    const getDbForRead = () => (usePrimary ? primary : getReplica(replicas));

    const select: Q["select"] = (...args: []) => getDbForRead().select(...args);
    const selectDistinct: Q["selectDistinct"] = (...args: []) =>
      getDbForRead().selectDistinct(...args);
    const selectDistinctOn: Q["selectDistinctOn"] = (...args: [any]) =>
      getDbForRead().selectDistinctOn(...args);
    const $count: Q["$count"] = (...args: [any]) =>
      getDbForRead().$count(...args);
    const _with: Q["with"] = (...args: any) => getDbForRead().with(...args);
    const $with: Q["$with"] = (arg: any) => getDbForRead().$with(arg) as any;

    const executeOnReplica: Q["execute"] = (...args: [any]) =>
      getDbForRead().execute(...args);
    const transactionOnReplica: Q["transaction"] = (...args: [any]) =>
      getDbForRead().transaction(...args);

    const update: Q["update"] = (...args: [any]) => primary.update(...args);
    const insert: Q["insert"] = (...args: [any]) => primary.insert(...args);
    const $delete: Q["delete"] = (...args: [any]) => primary.delete(...args);
    const execute: Q["execute"] = (...args: [any]) => primary.execute(...args);
    const transaction: Q["transaction"] = (...args: [any]) =>
      primary.transaction(...args);
    const refreshMaterializedView: Q["refreshMaterializedView"] = (
      ...args: [any]
    ) => primary.refreshMaterializedView(...args);

    const usePrimaryOnly = (): ReplicatedDatabase<Q> => createDatabase(true);

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
      usePrimaryOnly,
      select,
      selectDistinct,
      selectDistinctOn,
      $count,
      $with,
      with: _with,
      get query() {
        return getDbForRead().query;
      },
    };
  };

  return createDatabase(false);
};
