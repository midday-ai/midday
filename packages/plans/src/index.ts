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

export function getPlanIntervalByProductId(
  productId: string,
): "month" | "year" {
  const plans = getPlans();
  const plan = Object.values(plans).find((p) => p.id === productId);

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
  connectors: number;
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

export function getPlanPricing(continent?: string | null): PlanPricing {
  const isEUR = continent === "EU";
  return {
    starter: { monthly: 19, yearly: 15 },
    pro: { monthly: 49, yearly: 39 },
    currency: isEUR ? "EUR" : "USD",
    symbol: isEUR ? "€" : "$",
  };
}

export type PlanFeature = {
  label: string;
  tooltip?: string;
};

export const starterFeatures: PlanFeature[] = [
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
    label: "Financial metrics",
    tooltip:
      "Track revenue, burn rate, profit, expenses, and runway with customizable dashboards.",
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
    label: "5 AI Connectors",
    tooltip:
      "Connect up to 5 of 60+ tools like Linear, Notion, HubSpot, and GitHub to the AI assistant.",
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
    label: "API, CLI, and MCP",
    tooltip:
      "REST API, CLI, SDKs, and MCP server for AI agents and custom workflows.",
  },
  { label: "3 banks · 15 invoices/mo · 10GB storage" },
];

export const proFeatures: PlanFeature[] = [
  { label: "Everything in Starter" },
  { label: "10 banks · 50 invoices/mo · 100GB storage" },
  {
    label: "20 AI Connectors",
    tooltip:
      "Connect up to 20 of 60+ tools like Linear, Notion, HubSpot, Figma, and more to the AI assistant.",
  },
  {
    label: "Custom transaction categories",
    tooltip:
      "Create your own categories and rules to match how your business operates.",
  },
  {
    label: "Invoice templates",
    tooltip:
      "Save and reuse invoice layouts for different clients or services.",
  },
  {
    label: "Customer portal",
    tooltip:
      "Let customers view and pay invoices through their own branded portal.",
  },
  {
    label: "Customer enrichment",
    tooltip:
      "Automatically enrich customer profiles with company details, social links, funding info, and more.",
  },
  {
    label: "Advanced metrics",
    tooltip:
      "Revenue forecasting, category breakdowns, and detailed financial analysis across your business.",
  },
  {
    label: "Advanced AI thinking",
    tooltip:
      "Deep analysis mode with extended reasoning for complex financial questions.",
  },
  {
    label: "Shareable report and document links",
    tooltip:
      "Generate view-only links with optional expiration for reports, receipts, and vault documents.",
  },
  // {
  //   label: "E-Invoicing (Peppol)",
  //   tooltip:
  //     "Send and receive e-invoices via the Peppol network for EU/global compliance.",
  // },
  { label: "Priority support" },
];

/** @deprecated Use starterFeatures instead */
export const planFeatures = starterFeatures;

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "starter":
      return {
        users: 2,
        bankConnections: 3,
        connectors: 5,
        storage: 10 * 1024 * 1024 * 1024,
        inbox: 150,
        invoices: 15,
      };
    case "trial":
    case "pro":
      return {
        users: 10,
        bankConnections: 10,
        connectors: 20,
        storage: 100 * 1024 * 1024 * 1024,
        inbox: 500,
        invoices: 50,
      };
    default:
      return {
        users: 1,
        bankConnections: 1,
        connectors: 2,
        storage: 1 * 1024 * 1024 * 1024,
        inbox: 50,
        invoices: 5,
      };
  }
}
