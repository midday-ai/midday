import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../types/db";

export type Client = SupabaseClient<Database>;

export * from "./db";
