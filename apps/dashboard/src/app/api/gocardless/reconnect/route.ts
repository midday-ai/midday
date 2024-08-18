import { getSession } from "@midday/supabase/cached-queries";
import { updateBankConnection } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = ["fra1", "sfo1", "iad1"];

export async function GET(req: NextRequest) {
  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const referenceId = requestUrl.searchParams.get("reference_id") ?? undefined;
  const isDesktop = requestUrl.searchParams.get("desktop");

  if (id) {
    const { data } = await updateBankConnection(supabase, { id, referenceId });
    revalidateTag(`bank_connections_${data?.team_id}`);
  }

  if (isDesktop === "true") {
    return NextResponse.redirect(
      `midday://settings/accounts?id=${id}&step=reconnect`,
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/settings/accounts?id=${id}&step=reconnect`,
  );
}
