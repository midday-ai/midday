import { isLocalBackend } from "@midday/utils/backend";
import type { Client } from "pg";

export function assertLocalMigrationMode(): void {
  if (!isLocalBackend()) {
    throw new Error(
      "The local database migrations require NEXT_PUBLIC_BACKEND_PROVIDER=local. Keep the existing Supabase schema and migration workflow for Supabase deployments.",
    );
  }
}

/** The fresh local baseline must never modify an existing Supabase installation. */
export async function assertLocalMigrationTarget(
  client: Pick<Client, "query">,
): Promise<void> {
  const { rows } = await client.query<{
    supabase_auth: string | null;
    supabase_storage: string | null;
  }>(
    "SELECT to_regclass('auth.users')::text AS supabase_auth, to_regclass('storage.objects')::text AS supabase_storage",
  );
  if (rows[0]?.supabase_auth || rows[0]?.supabase_storage) {
    throw new Error(
      "Refusing to apply the local baseline to a Supabase database. Select a separate database for the local backend.",
    );
  }
}
