import type { Database } from "@midday/supabase/src/types";
import { Resend } from "@trigger.dev/resend";
import { TriggerClient } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";

export const client = new TriggerClient({
  id: "midday-G6Yq",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});

export const supabase = new Supabase<Database>({
  id: "supabase",
  projectId: process.env.NEXT_PUBLIC_SUPABASE_ID!,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
});

const supabaseManagement = new SupabaseManagement({
  id: "supabase-management",
  apiKey: process.env.SUPABASE_API_KEY!,
});

export const db = supabaseManagement.db(
  `https://${process.env.NEXT_PUBLIC_SUPABASE_ID}.supabase.co`
);

export const resend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY!,
});
