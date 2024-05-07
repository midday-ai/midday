import { env } from "@/env.mjs";
import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { Events, client } from "@midday/jobs";
import { LoopsClient } from "loops";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const loops = new LoopsClient(env.LOOPS_API_KEY);

// NOTE: This is trigger from supabase database webhook
export async function POST(req: Request) {
  const key = headers().get("x-api-key");

  if (key !== env.API_ROUTE_SECRET) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  const body = await req.json();

  const email = body.record.email;
  const userId = body.record.id;
  const fullName = body.record.raw_user_meta_data.full_name;

  const logsnag = await setupLogSnag({
    userId,
    fullName,
  });

  logsnag.track({
    event: LogEvents.Registered.name,
    icon: LogEvents.Registered.icon,
    channel: LogEvents.Registered.channel,
  });

  // NOTE: Start onboarding email for enabled beta users
  // client.sendEvent({
  //   id: userId,
  //   name: Events.ONBOARDING_EMAILS,
  //   payload: {
  //     fullName,
  //     email,
  //   },
  // });

  try {
    const found = await loops.findContact(email);
    const [firstName, lastName] = fullName.split(" ");

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
