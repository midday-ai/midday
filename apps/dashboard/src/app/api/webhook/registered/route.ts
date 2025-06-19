import * as crypto from "node:crypto";
import { createServerTRPCClient } from "@/trpc/server-client";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// NOTE: This is trigger from supabase database webhook
export async function POST(req: Request) {
  const text = await req.clone().text();
  const signature = (await headers()).get("x-supabase-signature");

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

  const userId = body.record.id;
  const fullName = body.record.full_name;

  const analytics = await setupAnalytics({
    userId,
    fullName,
  });

  analytics.track({
    event: LogEvents.Registered.name,
    channel: LogEvents.Registered.channel,
  });

  try {
    const caller = await createServerTRPCClient();

    const result = await caller.jobs.onboardTeam({
      userId,
    });

    console.log(
      `Onboarding job scheduled for user ${userId} with job ID: ${result.jobId}`,
    );
  } catch (error) {
    console.error("Failed to schedule onboarding job:", error);
    // Don't fail the webhook if job scheduling fails
  }

  return NextResponse.json({ success: true });
}
