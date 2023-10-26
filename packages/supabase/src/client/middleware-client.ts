import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "../types/db";

export function getSupabaseMiddlewareClient(
  req: NextRequest,
  res: NextResponse,
  params = {
    admin: false,
  },
) {
  if (params.admin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  return createMiddlewareClient<Database>(
    {
      req,
      res,
    },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  );
}
