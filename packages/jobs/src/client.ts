import type { Database } from "@midday/supabase/src/types";
import { Resend } from "@trigger.dev/resend";
import { TriggerClient } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";

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

export const resend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY!,
});
