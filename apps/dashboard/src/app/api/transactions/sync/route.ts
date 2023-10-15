// import { getSupabasRouteClient } from "@midday/supabase/route-client";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
