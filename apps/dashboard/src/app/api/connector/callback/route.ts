import { getTeamId } from "@/utils/team";
import { InboxConnector } from "@midday/inbox/connector";
import { tasks } from "@trigger.dev/sdk/v3";
import type { syncInboxAccount } from "jobs/tasks/inbox/provider/sync-account";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") as "gmail" | "outlook";
  const teamId = await getTeamId();

  if (!code || !state || !teamId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const connector = new InboxConnector(state);
    const account = await connector.exchangeCodeForAccount({ code, teamId });

    if (!account) {
      return NextResponse.redirect(
        new URL("/inbox?connect=failed", request.url),
        { status: 302 },
      );
    }

    await tasks.trigger<typeof syncInboxAccount>("sync-inbox-account", {
      id: account.id,
    });

    return NextResponse.redirect(
      new URL(`/inbox?success=true&provider=${state}`, request.url),
      {
        status: 302,
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/inbox?connect=failed", request.url),
      { status: 302 },
    );
  }
}
