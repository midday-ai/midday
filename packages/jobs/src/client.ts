import { Database } from "@midday/supabase/src/types";
import { TriggerClient } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";

export const client = new TriggerClient({
  id: "midday-CpkS",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});

export const supabase = new Supabase<Database>({
  id: "supabase",
  projectId: process.env.SUPABASE_ID!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export const supabaseManagement = new SupabaseManagement({
  id: "supabase-integration",
});

export const supabaseTriggers = supabaseManagement.db(process.env.SUPABASE_ID!);
