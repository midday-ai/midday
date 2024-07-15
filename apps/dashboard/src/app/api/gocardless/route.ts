import { updateBankConnection } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = ["fra1", "sfo1", "iad1"];

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const isDesktop = requestUrl.searchParams.get("desktop");

  if (id) {
    await updateBankConnection(supabase, { id });
  }

  if (isDesktop === "true") {
    return NextResponse.redirect("midday://");
  }

  return NextResponse.redirect(requestUrl.origin);
}
