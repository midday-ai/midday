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
  },
} as const;

export type PlanKey = "starter";
export type PlanProductKey = "starter" | "starter_yearly";

export type PlanEnvironment = "production" | "sandbox";

const LEGACY_PRO_PRODUCTS = {
  production: {
    pro: {
      id: "0a0a36b1-38d3-4082-85ca-f46cec9d8b1a",
      key: "pro" as const,
      interval: "month" as const,
    },
    pro_yearly: {
      id: "a1b1bef6-fd61-447c-84c5-33b602e1b854",
      key: "pro" as const,
      interval: "year" as const,
    },
  },
  sandbox: {
    pro: {
      id: "dc9e75d2-c1ef-4265-9265-f599e54eb172",
      key: "pro" as const,
      interval: "month" as const,
    },
    pro_yearly: {
      id: "439697ce-73ad-439f-8b73-c5bee854a811",
      key: "pro" as const,
      interval: "year" as const,
    },
  },
};

export const getPlans = () => {
  return PLANS[POLAR_ENVIRONMENT];
};

export function getPlanProductId(plan: PlanKey, yearly: boolean): string {
  const plans = getPlans();
  const productKey: PlanProductKey = yearly ? `${plan}_yearly` : plan;
  return plans[productKey].id;
}

function findProductById(productId: string) {
  const plans = getPlans();
  const active = Object.values(plans).find((p) => p.id === productId);
  if (active) return active;

  const legacy = Object.values(LEGACY_PRO_PRODUCTS[POLAR_ENVIRONMENT]).find(
    (p) => p.id === productId,
  );
  return legacy ?? null;
}

export function getPlanByProductId(productId: string): "starter" | "pro" {
  const plan = findProductById(productId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan.key;
}

export function getPlanIntervalByProductId(
  productId: string,
): "month" | "year" {
  const plan = findProductById(productId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan.interval;
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
  currency: string;
  symbol: string;
};

export function getPlanPricing(continent?: string | null): PlanPricing {
  const isEUR = continent === "EU";
  return {
    starter: { monthly: 19, yearly: 15 },
    currency: isEUR ? "EUR" : "USD",
    symbol: isEUR ? "€" : "$",
  };
}

export type PlanFeature = {
  label: string;
  tooltip?: string;
};

export const planFeatures: PlanFeature[] = [
  {
    label: "Invoicing and payments",
    tooltip:
      "Recurring schedules, templates, customer portal, and online card payments.",
  },
  {
    label: "Transactions and bank sync",
    tooltip:
      "Connect to 20,000+ banks. Transactions categorized automatically.",
  },
  {
    label: "Inbox and receipt matching",
    tooltip:
      "Forward receipts from Gmail, Outlook, Slack, or WhatsApp. Matched to transactions automatically.",
  },
  {
    label: "Accounting exports",
    tooltip: "Export to Xero, QuickBooks, Fortnox, or CSV with one click.",
  },
  {
    label: "Time tracking",
    tooltip: "Track billable hours per project and turn them into invoices.",
  },
  {
    label: "AI assistant",
    tooltip:
      "Ask questions about revenue, spending, and invoices in plain language.",
  },
  {
    label: "Financial overview and reports",
    tooltip:
      "Live dashboard with profit & loss, burn rate, runway, cash flow, and tax summaries.",
  },
  {
    label: "Vault",
    tooltip:
      "Store and organize documents. Attach to transactions and invoices.",
  },
  {
    label: "Apps and integrations",
    tooltip: "Slack, Gmail, Outlook, Stripe, Google Drive, Dropbox, and more.",
  },
  {
    label: "Multi-currency",
    tooltip:
      "Invoice in any currency. Converted to your base currency automatically.",
  },
  {
    label: "Customer management",
    tooltip:
      "Store customer details, track history, and reuse across invoices and projects.",
  },
  {
    label: "API and MCP",
    tooltip:
      "REST API, SDKs, and MCP server for AI agents and custom workflows.",
  },
];

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "starter":
    case "trial":
    case "pro":
      return {
        users: 10,
        bankConnections: 10,
        storage: 100 * 1024 * 1024 * 1024,
        inbox: 500,
        invoices: 50,
      };
    default:
      return {
        users: 1,
        bankConnections: 1,
        storage: 1 * 1024 * 1024 * 1024,
        inbox: 50,
        invoices: 5,
      };
  }
}
