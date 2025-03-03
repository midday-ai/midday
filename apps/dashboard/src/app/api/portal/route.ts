import { api } from "@/utils/polar";
import { getSession } from "@midday/supabase/cached-queries";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user?.id) {
    throw new Error("You must be logged in");
  }

  const customerId = req.nextUrl.searchParams.get("id");

  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const result = await api.customerSessions.create({
    customerId,
  });

  return NextResponse.redirect(result.customerPortalUrl);
}
