import * as crypto from "node:crypto";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { tasks } from "@trigger.dev/sdk/v3";
import type { onboardTeam } from "jobs/tasks/team/onboarding";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NOTE: This is trigger from supabase database webhook
export async function POST(req: Request) {
  const text = await req.clone().text();
  const signature = headers().get("x-supabase-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing signature" }, { status: 401 });
  }

  const decodedSignature = Buffer.from(signature, "base64");

  const calculatedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET_KEY!)
    .update(text)
    .digest();

  const hmacMatch = crypto.timingSafeEqual(
    decodedSignature,
    calculatedSignature,
  );

  if (!hmacMatch) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  const body = await req.json();

  const email = body.record.email;
  const userId = body.record.id;
  const fullName = body.record.raw_user_meta_data.full_name;

  const analytics = await setupAnalytics({
    userId,
    fullName,
  });

  analytics.track({
    event: LogEvents.Registered.name,
    channel: LogEvents.Registered.channel,
  });

  const user = await getUser();

  if (user?.data?.team_id) {
    await tasks.trigger<typeof onboardTeam>("onboard-team", {
      teamId: user.data.team_id,
      fullName,
      email,
    });
  }

  return NextResponse.json({ success: true });
}
