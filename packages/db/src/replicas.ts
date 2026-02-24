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

    const replicaDb = getDbForRead();
    const transactionOnReplica = replicaDb.transaction.bind(replicaDb);

    const usePrimaryOnly = (): ReplicatedDatabase<Q> => createDatabase(true);

    // Bind a method to its owning database so `this.session` resolves
    // to the correct pool. Without binding, the spread of `...primary`
    // copies `session` as an own property, and JS method-call semantics
    // set `this` to the proxy object — routing every query to primary.
    const bind = (db: Q, method: any): any =>
      typeof method === "function" ? method.bind(db) : method;

    return {
      ...primary,
      get select() {
        const db = getDbForRead();
        return bind(db, db.select);
      },
      get selectDistinct() {
        const db = getDbForRead();
        return bind(db, db.selectDistinct);
      },
      get selectDistinctOn() {
        const db = getDbForRead();
        return bind(db, db.selectDistinctOn);
      },
      get $count() {
        const db = getDbForRead();
        return bind(db, db.$count);
      },
      get with() {
        const db = getDbForRead();
        return bind(db, db.with);
      },
      get $with() {
        const db = getDbForRead();
        return bind(db, db.$with);
      },
      get query() {
        return getDbForRead().query;
      },
      get update() {
        return bind(primary, primary.update);
      },
      get insert() {
        return bind(primary, primary.insert);
      },
      get delete() {
        return bind(primary, primary.delete);
      },
      get execute() {
        return bind(primary, primary.execute);
      },
      get transaction() {
        return bind(primary, primary.transaction);
      },
      get refreshMaterializedView() {
        return bind(primary, primary.refreshMaterializedView);
      },
      executeOnReplica,
      transactionOnReplica,
      $primary: primary,
      usePrimaryOnly,
    } as ReplicatedDatabase<Q>;
  };

  return createDatabase(false);
};
