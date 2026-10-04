import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTRPCClient } from "@/trpc/server";
import { getUrl } from "@/utils/environment";

export async function GET(req: NextRequest) {
  const origin = getUrl();
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const referenceId = requestUrl.searchParams.get("reference_id") ?? undefined;
  const accessValidForDays = Number(
    requestUrl.searchParams.get("access_valid_for_days"),
  );
  const isDesktop = requestUrl.searchParams.get("desktop");

  if (id) {
    await (await getTRPCClient()).bankConnections.updateReconnect.mutate({
      id,
      referenceId,
      accessValidForDays: accessValidForDays || 180,
    });
  }

  if (isDesktop === "true") {
    const scheme = process.env.NEXT_PUBLIC_DESKTOP_SCHEME || "midday";
    return NextResponse.redirect(
      `${scheme}://settings/accounts?id=${id}&step=reconnect`,
    );
  }

  return NextResponse.redirect(
    `${origin}/settings/accounts?id=${id}&step=reconnect`,
  );
}
