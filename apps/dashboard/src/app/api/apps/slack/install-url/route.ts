import { trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { getInstallUrl } from "@midday/app-store/slack";
import { NextResponse } from "next/server";

export async function GET() {
  const queryClient = getQueryClient();
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.teamId) {
    return NextResponse.json({ error: "Team not found" }, { status: 401 });
  }

  const url = await getInstallUrl({
    teamId: user.teamId,
    userId: user.id,
  });

  return NextResponse.json({
    url,
  });
}
