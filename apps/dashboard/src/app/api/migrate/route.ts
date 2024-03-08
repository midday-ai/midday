import { scheduler } from "@midday/jobs/src/transactions/scheduler";
import { NextResponse } from "next/server";

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const teamId = requestUrl.searchParams.get("teamId");

  if (teamId) {
    const event = await scheduler.register(teamId, {
      type: "interval",
      options: {
        seconds: 3600, // every 1h
      },
    });

    return NextResponse.json(event);
  }

  return NextResponse.json({ error: "No team ID provided" });
}
