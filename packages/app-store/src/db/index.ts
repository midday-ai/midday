import { createClient } from "@midday/supabase/server";
import { createApp as createAppWithDb } from "@midday/db/queries";
import type { Database } from "@midday/db/client";

type CreateAppParams = {
  team_id: string;
  created_by: string;
  app_id: string;
  settings?: unknown;
  config?: unknown;
};

/**
 * Create app integration. Works with both Supabase client (dashboard) and Drizzle database (API).
 * If db is provided, uses Drizzle. Otherwise, falls back to Supabase client.
 */
export async function createApp(
  params: CreateAppParams,
  db?: Database,
) {
  // If database instance is provided (API context), use Drizzle
  if (db) {
    return createAppWithDb(db, {
      teamId: params.team_id,
      createdBy: params.created_by,
      appId: params.app_id,
      settings: params.settings,
      config: params.config,
    });
  }

  // Otherwise, use Supabase client (dashboard context)
  const client = await createClient({ admin: true });

  const { data, error } = await client
    .from("apps")
    .upsert({
      team_id: params.team_id,
      created_by: params.created_by,
      app_id: params.app_id,
      settings: params.settings,
      config: params.config,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
