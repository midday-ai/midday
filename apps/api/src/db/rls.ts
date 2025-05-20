import { sql } from "drizzle-orm";
import type { Database } from ".";

type SupabaseToken = {
  sub?: string;
  role?: string;
};

export async function withRLS<T>(
  db: Database,
  token: SupabaseToken,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  // Inject session config
  await db.executeOnReplica(sql`
    select set_config('request.jwt.claims', ${JSON.stringify(token)}, true);
    select set_config('request.jwt.claim.sub', ${token.sub ?? ""}, true);
    set local role ${sql.raw(token.role ?? "authenticated")};
  `);

  try {
    return await fn(db);
  } finally {
    await db.executeOnReplica(sql`
      reset role;
      select set_config('request.jwt.claims', null, true);
      select set_config('request.jwt.claim.sub', null, true);
    `);
  }
}
