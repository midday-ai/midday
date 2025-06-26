import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const createClient = () =>
  createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey);
