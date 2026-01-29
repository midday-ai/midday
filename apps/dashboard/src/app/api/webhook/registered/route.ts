import * as crypto from "node:crypto";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NOTE: This is triggered from supabase database webhook
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

  const analytics = await setupAnalytics();

  analytics.track({
    event: LogEvents.Registered.name,
    channel: LogEvents.Registered.channel,
  });

  return NextResponse.json({ success: true });
}
