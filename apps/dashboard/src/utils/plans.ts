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

export const getPlans = () => {
  return PLANS[POLAR_ENVIRONMENT as keyof typeof PLANS];
};

export function getPlanByProductId(productId: string) {
  const plan = Object.values(getPlans()).find((plan) => plan.id === productId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan.key;
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
