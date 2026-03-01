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
    starter: { monthly: 29, yearly: 23 },
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
    label: "Invoicing with recurring and online payments",
    tooltip:
      "Set up weekly to yearly recurring schedules. Accept online payments by card.",
  },
  {
    label: "Automatic bank sync and categorization",
    tooltip: "Connect to 20,000+ banks across the US, Canada, UK, and Europe.",
  },
  {
    label: "Receipt capture via Gmail, Outlook, or upload",
    tooltip:
      "Also supports Slack, WhatsApp, and email forwarding. AI matches receipts to transactions.",
  },
  {
    label: "Financial reports, burn rate, and tax summaries",
    tooltip:
      "Includes profit & loss, runway, revenue forecast, balance sheet, cash flow, and more.",
  },
  {
    label: "AI assistant",
    tooltip:
      "Ask questions about revenue, spending, runway, and invoices in plain language.",
  },
  {
    label: "Time tracking and project billing",
    tooltip:
      "Track billable hours per project, export to spreadsheet, and create invoices from tracked time.",
  },
  {
    label: "Multi-currency support",
    tooltip:
      "View all financials in one base currency, send invoices in any currency, and match cross-currency receipts.",
  },
  {
    label: "Export to Xero, QuickBooks, or Fortnox",
    tooltip:
      "Export categorized transactions and attachments to your accounting software. CSV export also available.",
  },
  { label: "3 banks · 15 invoices · 10GB storage" },
];

export const proFeatures: PlanFeature[] = [
  { label: "Everything in Starter" },
  { label: "10 banks · 50 invoices · 100GB storage" },
  { label: "Up to 10 team members" },
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
    label: "Advanced AI insights",
    tooltip:
      "Get alerts on unusual spending, cash flow trends, and automated suggestions based on your financial data.",
  },
  {
    label: "Shareable report and document links",
    tooltip:
      "Generate view-only links with optional expiration for reports, receipts, and vault documents.",
  },
  {
    label: "API access and integrations",
    tooltip:
      "Build custom integrations with the Midday API. SDKs available for all major languages.",
  },
  { label: "Priority support" },
];

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
