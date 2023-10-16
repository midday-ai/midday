// import { getSupabasRouteClient } from "@midday/supabase/route-client";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Get bank accounts (ref, team_id)
  // 2. Get last transaction for team_id
  // 3. Fetch latest transactions for last 5 days
  // 4. Update or create
  // 5. Send email
  return NextResponse.json({ ok: true });
}
