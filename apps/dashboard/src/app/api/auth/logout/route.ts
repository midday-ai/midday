import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const supabase = await createClient();

  await supabase.auth.signOut({ scope: "local" });

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
