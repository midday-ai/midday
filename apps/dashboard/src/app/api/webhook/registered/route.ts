import * as crypto from "node:crypto";
import { env } from "@/env.mjs";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { LoopsClient } from "loops";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const loops = new LoopsClient(env.LOOPS_API_KEY);

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
    calculatedSignature
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

  await client.sendEvent({
    id: userId,
    name: Events.ONBOARDING_EMAILS,
    payload: {
      fullName,
      email,
    },
  });

  try {
    const found = await loops.findContact(email);
    const [firstName, lastName] = fullName?.split(" ") ?? [];

    if (found.length > 0) {
      const userId = found?.at(0)?.id;

      if (!userId) {
        return null;
      }

      await loops.updateContact(email, {
        userId,
        userGroup: "registered",
        firstName,
        lastName,
      });
    } else {
      await loops.createContact(email, {
        userId: body.record.id,
        userGroup: "registered",
        firstName,
        lastName,
      });
    }
  } catch (err) {
    console.log(err);
  }

  return NextResponse.json({ success: true });
}
