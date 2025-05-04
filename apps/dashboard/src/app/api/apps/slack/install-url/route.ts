import { getTeamId } from "@/utils/team";
import { getInstallUrl } from "@midday/app-store/slack";
import { getSession } from "@midday/supabase/cached-queries";
import { NextResponse } from "next/server";

export async function GET() {
  const {
    data: { session },
  } = await getSession();

  const teamId = await getTeamId();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!teamId) {
    return NextResponse.json({ error: "Team not found" }, { status: 401 });
  }

  const url = await getInstallUrl({
    teamId,
    userId: session.user.id,
  });

  return NextResponse.json({
    url,
  });
}
