import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

export const createClient = () =>
  createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
