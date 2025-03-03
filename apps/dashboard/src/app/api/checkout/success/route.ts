import type { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const isDesktop = searchParams.get("isDesktop") === "true";
  const redirectPath = searchParams.get("redirectPath") ?? "/";

  if (isDesktop) {
    return NextResponse.redirect(`midday://${redirectPath}`);
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
};
