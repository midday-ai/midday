import {
  SupabaseClient,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";
import invariant from "tiny-invariant";
import { Database } from "../types/db";

let client: SupabaseClient<Database>;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const NEXT_PUBLIC_SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  invariant(NEXT_PUBLIC_SUPABASE_URL, "Supabase URL was not provided");
  invariant(
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Supabase Anon key was not provided",
  );

  client = createClientComponentClient<Database>({
    supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return client;
}
