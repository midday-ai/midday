import { getDiscount, getPlans } from "@/utils/plans";
import { api } from "@/utils/polar";
import { getSession, getUser } from "@midday/supabase/cached-queries";
import { geolocation } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
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

  const userData = await getUser();

  if (!userData?.data?.team) {
    throw new Error("Team not found");
  }

  const discountId = getDiscount(userData.data.team.created_at, planType);

  const { country } = geolocation(req);

  const successUrl = new URL(redirectPath, req.nextUrl.origin);

  if (isDesktop) {
    successUrl.searchParams.set("isDesktop", "true");
  }

  const checkout = await api.checkouts.create({
    productId: selectedPlan.id,
    successUrl: successUrl.toString(),
    customerExternalId: teamId,
    customerEmail: userData.data.email ?? undefined,
    customerName: userData.data.full_name ?? undefined,
    discountId: discountId?.id,
    customerBillingAddress: {
      country: country ?? "US",
    },
    metadata: {
      organizationId: teamId,
    },
  });

  return NextResponse.redirect(checkout.url);
};
