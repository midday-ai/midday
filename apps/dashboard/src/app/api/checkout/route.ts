import { getDiscount, getPlans } from "@/utils/plans";
import { api } from "@/utils/polar";
import { getSession } from "@midday/supabase/cached-queries";
import { getTeamByIdQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await getSession();

  if (!session?.user?.id) {
    throw new Error("You must be logged in");
  }

  const plan = req.nextUrl.searchParams.get("plan");
  const redirectPath = req.nextUrl.searchParams.get("redirectPath") ?? "/";
  const teamId = req.nextUrl.searchParams.get("teamId");
  const isDesktop = req.nextUrl.searchParams.get("isDesktop") === "true";
  const planType = req.nextUrl.searchParams.get("planType");

  const plans = getPlans();

  const selectedPlan = plans[plan as keyof typeof plans];

  if (!selectedPlan) {
    throw new Error("Invalid plan");
  }

  const { data: team } = await getTeamByIdQuery(supabase, teamId!);

  if (!team) {
    throw new Error("Team not found");
  }

  const discountId = getDiscount(planType);

  const successUrl = new URL("/api/checkout/success", req.nextUrl.origin);
  successUrl.searchParams.set("redirectPath", redirectPath);

  if (isDesktop) {
    successUrl.searchParams.set("isDesktop", "true");
  }

  const checkout = await api.checkouts.create({
    products: [selectedPlan.id],
    successUrl: successUrl.toString(),
    externalCustomerId: team.id,
    customerEmail: session.user.email ?? undefined,
    customerName: team.name ?? undefined,
    discountId: discountId?.id,
    metadata: {
      teamId: team.id,
      companyName: team.name ?? "",
    },
  });

  return NextResponse.redirect(checkout.url);
};
