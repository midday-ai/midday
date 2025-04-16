import { getTeamId } from "@/utils/team";
import { InboxConnector } from "@midday/inbox/connector";
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
    const acount = await connector.exchangeCodeForAccount({ code, teamId });

    console.log({ acount });

    // Trigger initial setup
    const eventId = "12wefwef23e23";

    return NextResponse.redirect(
      new URL(`/inbox?event_id=${eventId}`, request.url),
      { status: 302 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/inbox?connect=failed", request.url),
      { status: 302 },
    );
  }
}
