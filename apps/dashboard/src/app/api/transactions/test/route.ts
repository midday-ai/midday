import { TriggerEvents, trigger } from "@midday/notification";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  await trigger({
    event: TriggerEvents.TransactionNew,
    payload: {
      description: "You have a new transaction of 1000 kr from Github Inc",
      transactionId: "5590c929-7fc6-4fcc-9e81-b5e1bfb4b431",
    },
    users: [
      {
        subscriberId: "ec10c095-8cf7-4ba3-a62e-98f2a3d40c4c",
        email: "pontus@lostisland.co",
        fullName: "Pontus Abrahamsson",
        avatarUrl:
          "https://service.midday.ai/storage/v1/object/public/avatars/ec10c095-8cf7-4ba3-a62e-98f2a3d40c4c/655158.jpg",
      },
    ],
  });

  return NextResponse.json({ ok: true });
}
