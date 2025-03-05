import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const isDesktop = searchParams.get("isDesktop") === "true";
  const redirectPath = searchParams.get("redirectPath") ?? "/";

  if (isDesktop) {
    const url = new URL(req.url);

    url.pathname = "/desktop/checkout/success";
    url.searchParams.set("redirectPath", redirectPath);

    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
};
