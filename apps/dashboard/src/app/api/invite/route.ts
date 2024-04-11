import { env } from "@/env.mjs";
import { Events, client as trigger } from "@midday/jobs";
import { client as redis } from "@midday/kv";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = headers().get("x-api-key");

  if (key !== env.API_ROUTE_SECRET) {
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  }

  try {
    const { email, fullName } = await req.json();

    if (email && fullName) {
      await redis.append("approved", email);

      await trigger.sendEvent({
        name: Events.ONBOARDING_EMAILS,
        payload: {
          fullName,
          email,
        },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.log(error);
  }
}
