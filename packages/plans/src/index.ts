const POLAR_ENVIRONMENT = process.env.POLAR_ENVIRONMENT as
  | "production"
  | "sandbox";

export const PLANS = {
  production: {
    starter: {
      id: "ac17601d-29a9-4530-ab9d-9f6ea39f7e32",
      name: "Starter",
      key: "starter",
      interval: "month",
    },
    starter_yearly: {
      id: "f304b841-5b5f-416b-90f3-4af518d27399",
      name: "Starter Yearly",
      key: "starter",
      interval: "year",
    },
    pro: {
      id: "0a0a36b1-38d3-4082-85ca-f46cec9d8b1a",
      name: "Pro",
      key: "pro",
      interval: "month",
    },
    pro_yearly: {
      id: "a1b1bef6-fd61-447c-84c5-33b602e1b854",
      name: "Pro Yearly",
      key: "pro",
      interval: "year",
    },
  },
  sandbox: {
    starter: {
      id: "265b6845-4fca-4813-86b7-70fb606626dd",
      name: "Starter",
      key: "starter",
      interval: "month",
    },
    starter_yearly: {
      id: "7437aadf-9571-4f20-989e-9a6d30b71947",
      name: "Starter Yearly",
      key: "starter",
      interval: "year",
    },
    pro: {
      id: "dc9e75d2-c1ef-4265-9265-f599e54eb172",
      name: "Pro",
      key: "pro",
      interval: "month",
    },
    pro_yearly: {
      id: "439697ce-73ad-439f-8b73-c5bee854a811",
      name: "Pro Yearly",
      key: "pro",
      interval: "year",
    },
  },
} as const;

export type PlanKey = "starter" | "pro";
export type PlanProductKey =
  | "starter"
  | "starter_yearly"
  | "pro"
  | "pro_yearly";

export type PlanEnvironment = "production" | "sandbox";

export const getPlans = () => {
  return PLANS[POLAR_ENVIRONMENT];
};

export function getPlanProductId(plan: PlanKey, yearly: boolean): string {
  const plans = getPlans();
  const productKey: PlanProductKey = yearly ? `${plan}_yearly` : plan;
  return plans[productKey].id;
}

export function getPlanByProductId(productId: string): PlanKey {
  const plans = getPlans();
  const plan = Object.values(plans).find((p) => p.id === productId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan.key as PlanKey;
}

export function getPlanName(plan: string | null | undefined): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "trial":
      return "Trial";
    default:
      return "Free";
  }
}

export type PlanLimits = {
  users: number;
  bankConnections: number;
  storage: number;
  inbox: number;
  invoices: number;
};

export type PlanPricing = {
  starter: { monthly: number; yearly: number };
  pro: { monthly: number; yearly: number };
  currency: string;
  symbol: string;
};

export function getPlanPricing(currency?: string | null): PlanPricing {
  const isEUR = currency === "EUR";
  return {
    starter: { monthly: isEUR ? 29 : 29, yearly: isEUR ? 23 : 23 },
    pro: { monthly: isEUR ? 49 : 49, yearly: isEUR ? 39 : 39 },
    currency: isEUR ? "EUR" : "USD",
    symbol: isEUR ? "€" : "$",
  };
}

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "starter":
      return {
        users: 2,
        bankConnections: 3,
        storage: 10 * 1024 * 1024 * 1024, // 10GB in bytes
        inbox: 150,
        invoices: 15,
      };
    case "trial":
    case "pro":
      return {
        users: 10,
        bankConnections: 10,
        storage: 100 * 1024 * 1024 * 1024, // 100GB in bytes
        inbox: 500,
        invoices: 50,
      };
    default:
      return {
        users: 2,
        bankConnections: 3,
        storage: 10 * 1024 * 1024 * 1024, // 10GB in bytes
        inbox: 150,
        invoices: 15,
      };
  }
}
