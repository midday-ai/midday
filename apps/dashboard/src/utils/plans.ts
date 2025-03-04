import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const PLANS = {
  starter: {
    id: "ac17601d-29a9-4530-ab9d-9f6ea39f7e32",
    name: "Starter",
    key: "starter",
  },
  pro: {
    id: "0a0a36b1-38d3-4082-85ca-f46cec9d8b1a",
    name: "Pro",
    key: "pro",
  },
};

export const DISCOUNTS = {
  early_access: {
    id: "cdcfb924-1f42-40ba-af5e-c8fb1fe7981b",
    name: "Early Access",
  },
  public_beta: {
    id: "ced3af53-fb27-41f5-abdd-070f382995b8",
    name: "Public Beta",
  },
};

export const getDiscount = (createdAt: string) => {
  const createdAtDate = new Date(createdAt);

  const earlyAccessCutoff = new Date("2024-07-01");
  const publicBetaCutoff = new Date("2025-03-01");

  if (createdAtDate < earlyAccessCutoff) {
    return DISCOUNTS.early_access;
  }

  if (createdAtDate >= earlyAccessCutoff && createdAtDate < publicBetaCutoff) {
    return DISCOUNTS.public_beta;
  }

  // Change this to null after the public beta
  return DISCOUNTS.public_beta;
};

export const getProPlanPrice = (createdAt: string) => {
  const createdAtDate = new Date(createdAt);

  const earlyAccessCutoff = new Date("2024-07-01");
  const publicBetaCutoff = new Date("2025-03-01");

  if (createdAtDate < earlyAccessCutoff) {
    return 30;
  }

  if (createdAtDate >= earlyAccessCutoff && createdAtDate < publicBetaCutoff) {
    return 49;
  }

  // Change this to 99 after the public beta
  return 49;
};

export async function updateTeamPlan(
  teamId: string,
  data: {
    plan: string;
    canceled_at?: Date;
  },
) {
  const supabase = createClient();

  const { data: teamData } = await supabase
    .from("teams")
    .update({
      plan,
      canceled_at,
    })
    .eq("id", teamId)
    .select("users_on_team(user_id)");

  revalidateTag(`teams_${teamId}`);

  // Revalidate the user cache for each user on the team
  for (const user of teamData?.users_on_team ?? []) {
    revalidateTag(`user_${user.user_id}`);
  }
}

export function getPlanByProductId(productId: string) {
  return Object.values(PLANS).find((plan) => plan.id === productId)?.key;
}
