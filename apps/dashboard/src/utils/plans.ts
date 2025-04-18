import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

const POLAR_ENVIRONMENT = process.env.POLAR_ENVIRONMENT;

export const PLANS = {
  production: {
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
  },
  sandbox: {
    starter: {
      id: "265b6845-4fca-4813-86b7-70fb606626dd",
      name: "Starter",
      key: "starter",
    },
    pro: {
      id: "dc9e75d2-c1ef-4265-9265-f599e54eb172",
      name: "Pro",
      key: "pro",
    },
  },
};

export const DISCOUNTS = {
  production: {
    early_access: {
      id: "cdcfb924-1f42-40ba-af5e-c8fb1fe7981b",
      name: "Early Access",
    },
    public_beta: {
      id: "ced3af53-fb27-41f5-abdd-070f382995b8",
      name: "Public Beta",
    },
  },
  sandbox: {
    early_access: {
      id: "fb38e1fb-6947-4ac1-8a89-43f6e0113d78",
      name: "Early Access",
    },
    public_beta: {
      id: "fb5e65fc-39b2-4212-a51a-fa6d1bd813e6",
      name: "Public Beta",
    },
  },
};

export const getDiscount = (createdAt: string, planType?: string | null) => {
  // Starter plan doesn't have a discount
  if (!planType || planType === "starter") {
    return null;
  }

  const discounts = DISCOUNTS[POLAR_ENVIRONMENT as keyof typeof DISCOUNTS];

  const createdAtDate = new Date(createdAt);

  const earlyAccessCutoff = new Date("2024-07-01");
  const publicBetaCutoff = new Date("2025-03-01");

  if (createdAtDate < earlyAccessCutoff) {
    return discounts.early_access;
  }

  if (createdAtDate >= earlyAccessCutoff && createdAtDate < publicBetaCutoff) {
    return discounts.public_beta;
  }

  // Change this to null after the public beta
  return discounts.public_beta;
};

export const getPlans = () => {
  return PLANS[POLAR_ENVIRONMENT as keyof typeof PLANS];
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

type UpdateTeamPlanData = {
  plan?: "trial" | "starter" | "pro";
  email?: string;
  canceled_at?: string | null;
};

export async function updateTeamPlan(teamId: string, data: UpdateTeamPlanData) {
  const supabase = await createClient({ admin: true });

  const { data: teamData } = await supabase
    .from("teams")
    .update(data)
    .eq("id", teamId)
    .select("users_on_team(user_id)")
    .single();

  revalidateTag(`teams_${teamId}`);

  // Revalidate the user cache for each user on the team
  for (const user of teamData?.users_on_team ?? []) {
    revalidateTag(`user_${user.user_id}`);
  }
}

export function getPlanByProductId(productId: string) {
  const plan = Object.values(getPlans()).find((plan) => plan.id === productId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan.key;
}

export async function canChooseStarterPlanQuery(teamId: string) {
  const supabase = await createClient();

  const [teamMembersResponse, bankConnectionsResponse] = await Promise.all([
    supabase.from("users_on_team").select("id").eq("team_id", teamId),
    supabase.from("bank_connections").select("id").eq("team_id", teamId),
  ]);

  // Can only choose starter if team has less than 2 members and less than or equal to 2 bank connection
  return (
    (teamMembersResponse.data?.length ?? 0) <= 2 &&
    (bankConnectionsResponse.data?.length ?? 0) <= 2
  );
}

export function getPlanLimits(plan: string) {
  switch (plan) {
    case "starter":
      return {
        users: 1,
        bankConnections: 1,
        storage: 10 * 1024 * 1024 * 1024, // 10GB in bytes
        inbox: 50,
        invoices: 10,
      };
    case "trial":
    case "pro":
      return {
        users: 10,
        bankConnections: 10,
        storage: 100, // 100GB in bytes
        inbox: 500,
        invoices: 30,
      };
    default:
      return {
        users: 1,
        bankConnections: 1,
        storage: 10 * 1024 * 1024 * 1024, // 10GB in bytes
        inbox: 50,
        invoices: 10,
      };
  }
}
