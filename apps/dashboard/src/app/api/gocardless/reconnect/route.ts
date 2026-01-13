import type { ReconnectConnectionPayload } from "@midday/jobs/schema";
import { getSession } from "@midday/supabase/cached-queries";
import { updateBankConnection } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { tasks } from "@trigger.dev/sdk";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = await createClient();
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const referenceId = requestUrl.searchParams.get("reference_id") ?? undefined;
  const isDesktop = requestUrl.searchParams.get("desktop");

  if (id) {
    await updateBankConnection(supabase, { id, referenceId });

    // Get team_id to trigger the reconnect job
    const { data: connection } = await supabase
      .from("bank_connections")
      .select("team_id")
      .eq("id", id)
      .single();

    // Trigger the reconnect job to safely update account IDs
    // This uses the shared matchAndUpdateAccountIds function to prevent
    // the multiple-row update issue when accounts share the same account_reference
    if (connection?.team_id) {
      await tasks.trigger("reconnect-connection", {
        teamId: connection.team_id,
        connectionId: id,
        provider: "gocardless",
      } satisfies ReconnectConnectionPayload);
    }
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
