import { Database } from "@midday/supabase/src/types";
import { OpenAI } from "@trigger.dev/openai";
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
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export const openai = new OpenAI({
  id: "openai",
  apiKey: process.env.OPENAI_API_KEY!,
});
