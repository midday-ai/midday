import { updateBankConnection } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const isDesktop = requestUrl.searchParams.get("desktop");

  if (id) {
    await updateBankConnection(supabase, id);
  }

  if (isDesktop === "true") {
    return NextResponse.redirect("midday://");
  }

  return NextResponse.redirect(requestUrl.origin);
}
