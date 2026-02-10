import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { TablesRelationalConfig } from "drizzle-orm/relations";

export type ReplicatedDatabase<Q extends PgDatabase<any, any, any>> = Q & {
  executeOnReplica: <
    TRow extends Record<string, unknown> = Record<string, unknown>,
  >(
    query: string | any,
  ) => Promise<TRow[]>;
  transactionOnReplica: Q["transaction"];
  usePrimaryOnly: () => ReplicatedDatabase<Q>;
  query: Q["query"];
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

    const executeOnReplica = async <
      TRow extends Record<string, unknown> = Record<string, unknown>,
    >(
      query: string | any,
    ): Promise<TRow[]> => {
      const result = await getDbForRead().execute(query);
      // Handle both QueryResult and direct array results
      if (Array.isArray(result)) {
        return result as TRow[];
      }
      return (result as any).rows as TRow[];
    };

    const transactionOnReplica = getDbForRead().transaction;

    const usePrimaryOnly = (): ReplicatedDatabase<Q> => createDatabase(true);

    return {
      ...primary,
      // Override methods to route to appropriate database
      get select() {
        return getDbForRead().select;
      },
      get selectDistinct() {
        return getDbForRead().selectDistinct;
      },
      get selectDistinctOn() {
        return getDbForRead().selectDistinctOn;
      },
      get $count() {
        return getDbForRead().$count;
      },
      get with() {
        return getDbForRead().with;
      },
      get $with() {
        return getDbForRead().$with;
      },
      get query() {
        return getDbForRead().query;
      },
      // Write operations always go to primary
      get update() {
        return primary.update;
      },
      get insert() {
        return primary.insert;
      },
      get delete() {
        return primary.delete;
      },
      get execute() {
        return primary.execute;
      },
      get transaction() {
        return primary.transaction;
      },
      get refreshMaterializedView() {
        return primary.refreshMaterializedView;
      },
      // Replica-specific methods
      executeOnReplica,
      transactionOnReplica,
      $primary: primary,
      usePrimaryOnly,
    } as ReplicatedDatabase<Q>;
  };

  return createDatabase(false);
};
