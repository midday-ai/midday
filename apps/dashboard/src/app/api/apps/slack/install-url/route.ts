import { getInstallUrl } from "@midday/app-store/slack";
import { getUser } from "@midday/supabase/cached-queries";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await getUser();

  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = await getInstallUrl({
    teamId: data.team_id,
    userId: data.id,
  });

  return NextResponse.json({
    url,
  });
}
