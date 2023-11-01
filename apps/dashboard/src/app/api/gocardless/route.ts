import { updateBankConnection } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const preferredRegion = "fra1";

export async function GET(req) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");

  if (id) {
    await updateBankConnection(supabase, id);
  }

  return NextResponse.redirect(requestUrl.origin);
}
