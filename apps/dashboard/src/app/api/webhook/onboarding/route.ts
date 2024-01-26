import { env } from "@/env.mjs";
import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import LoopsClient from "loops";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const loops = new LoopsClient(env.LOOPS_API_KEY);

export async function POST(req: Request) {
  const key = headers().get("x-api-key");

  if (key !== env.API_ROUTE_SECRET) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  const body = await req.json();

  console.log("katt", body);

  const email = body.record.email;

  const found = await loops.findContact(email);
  const [firstName, lastName] = body.record.full_name.split(" ");

  if (found.length > 0) {
    const userId = found?.at(0)?.id;
    console.log("katt 2", userId);

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

  await logsnag.track({
    event: LogEvents.Registered.name,
    icon: LogEvents.Registered.icon,
    user_id: email,
    channel: LogEvents.Registered.channel,
    tags: {
      email,
    },
  });

  return NextResponse.json({ success: true });
}
