import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
