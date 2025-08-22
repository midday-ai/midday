import { getQueryClient, trpc } from "@/trpc/server";
import type { InitialInboxSetupPayload } from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") as "gmail";
  const queryClient = getQueryClient();

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    const account = await queryClient.fetchQuery(
      trpc.inboxAccounts.exchangeCodeForAccount.queryOptions({
        code,
        provider: state,
      }),
    );

    if (!account) {
      return NextResponse.redirect(
        new URL("/inbox?connected=failed", request.url),
        { status: 302 },
      );
    }

    await tasks.trigger("initial-inbox-setup", {
      id: account.id,
    } satisfies InitialInboxSetupPayload);

    return NextResponse.redirect(
      new URL(`/inbox?connected=true&provider=${state}`, request.url),
      {
        status: 302,
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/inbox?connected=false", request.url),
      { status: 302 },
    );
  }
}
