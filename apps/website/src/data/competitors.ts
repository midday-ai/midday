// Competitor data for SEO comparison pages

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeatureComparison {
  category: string;
  features: {
    name: string;
    midday: boolean | string;
    competitor: boolean | string;
  }[];
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
}

export interface Competitor {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  keyDifferences: {
    title: string;
    midday: string;
    competitor: string;
  }[];
  features: FeatureComparison[];
  pricing: {
    midday: PricingTier[];
    competitor: PricingTier[];
    competitorNote?: string;
  };
  switchingSteps: {
    title: string;
    description: string;
  }[];
  faq: FAQItem[];
  targetAudience: string[];
}

export const middayDifferentiators = [
  {
    title: "Built for founders",
    description: "Designed for solo founders and small teams, not accountants",
  },
  {
    title: "Clean, modern interface",
    description: "No clutter, no complexity",
  },
  {
    title: "AI-powered insights",
    description: "Weekly summaries, assistant, automatic categorization",
  },
  {
    title: "Everything in one place",
    description: "Transactions, invoicing, time tracking, receipts",
  },
];

export const middayPricing: PricingTier[] = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    features: [
      "Financial overview and widgets",
      "Weekly summaries and insights",
      "Transactions with categorization",
      "Receipts and file storage",
      "Up to 10 invoices per month",
      "Time tracking",
      "Up to 2 connected banks",
      "Up to 2 team members",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Starter",
      "Up to 50 invoices per month",
      "Up to 10 connected banks",
      "Up to 10 team members",
      "Priority support",
    ],
  },
];

export const competitors: Competitor[] = [
  {
    id: "quickbooks",
    slug: "quickbooks-alternative",
    name: "QuickBooks",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a QuickBooks alternative? Midday offers a cleaner, founder-friendly approach to business finances without the accounting complexity.",
    keyDifferences: [
      {
        title: "Target User",
        midday: "Founders and small teams",
        competitor: "Accountants and bookkeepers",
      },
      {
        title: "Learning Curve",
        midday: "Intuitive, no training needed",
        competitor: "Steep learning curve",
      },
      {
        title: "Interface",
        midday: "Clean, modern design",
        competitor: "Complex, feature-heavy",
      },
      {
        title: "AI Features",
        midday: "Built-in AI assistant and insights",
        competitor: "Limited AI capabilities",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Bank connections", midday: true, competitor: true },
          { name: "Transaction categorization", midday: true, competitor: true },
          { name: "Invoicing", midday: true, competitor: true },
          { name: "Receipt capture", midday: true, competitor: true },
          { name: "Time tracking", midday: true, competitor: "Add-on" },
          { name: "AI-powered insights", midday: true, competitor: false },
          { name: "Weekly summaries", midday: true, competitor: false },
        ],
      },
      {
        category: "User Experience",
        features: [
          { name: "Modern interface", midday: true, competitor: false },
          { name: "Mobile app", midday: true, competitor: true },
          { name: "No accounting knowledge required", midday: true, competitor: false },
          { name: "Quick setup (under 5 min)", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Simple Start",
          price: "$30",
          period: "/month",
          features: [
            "Income & expenses",
            "Invoices & payments",
            "Tax deductions",
            "Mileage tracking",
            "1 user",
          ],
        },
        {
          name: "Essentials",
          price: "$60",
          period: "/month",
          features: [
            "Everything in Simple Start",
            "Bill management",
            "Time tracking",
            "3 users",
          ],
        },
        {
          name: "Plus",
          price: "$90",
          period: "/month",
          features: [
            "Everything in Essentials",
            "Inventory tracking",
            "Project profitability",
            "5 users",
          ],
        },
      ],
      competitorNote: "Prices increase after promotional period ends",
    },
    switchingSteps: [
      {
        title: "Export your data from QuickBooks",
        description:
          "Download your transaction history and customer list as CSV files from QuickBooks.",
      },
      {
        title: "Sign up for Midday",
        description:
          "Create your Midday account and connect your bank accounts directly.",
      },
      {
        title: "Import your customers",
        description:
          "Add your existing customers to continue invoicing seamlessly.",
      },
      {
        title: "Start fresh with automatic sync",
        description:
          "Your transactions will sync automatically going forward. No manual entry needed.",
      },
    ],
    faq: [
      {
        question: "Is Midday a full replacement for QuickBooks?",
        answer:
          "Midday is designed for founders who want financial clarity without accounting complexity. If you need advanced accounting features like inventory management or payroll, QuickBooks may be more suitable. But if you want a clean overview of your business finances with less overhead, Midday is the better choice.",
      },
      {
        question: "Can my accountant still access my data?",
        answer:
          "Yes. You can export your transactions and reports at any time, or give your accountant direct access to your Midday account.",
      },
      {
        question: "What about tax preparation?",
        answer:
          "Midday categorizes your transactions and tracks receipts, making tax prep straightforward. You can export everything your accountant needs at tax time.",
      },
      {
        question: "How does pricing compare long-term?",
        answer:
          "Midday's pricing is transparent and consistent. QuickBooks often increases prices after promotional periods and charges extra for features like time tracking. With Midday, you get more included at a predictable price.",
      },
    ],
    targetAudience: [
      "Solo founders who find QuickBooks overwhelming",
      "Small teams that don't need full accounting software",
      "Founders who want financial clarity without hiring a bookkeeper",
      "Teams that value modern, well-designed tools",
    ],
  },
  {
    id: "freshbooks",
    slug: "freshbooks-alternative",
    name: "FreshBooks",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a FreshBooks alternative? Midday combines invoicing with transactions, time tracking, and AI-powered insights in one unified workspace.",
    keyDifferences: [
      {
        title: "Focus",
        midday: "Complete financial workspace",
        competitor: "Primarily invoicing",
      },
      {
        title: "Bank Connections",
        midday: "25,000+ banks worldwide",
        competitor: "Limited bank support",
      },
      {
        title: "AI Features",
        midday: "Built-in AI assistant",
        competitor: "Basic automation only",
      },
      {
        title: "Pricing Model",
        midday: "Simple, transparent tiers",
        competitor: "Per-client pricing limits",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", midday: true, competitor: true },
          { name: "Time tracking", midday: true, competitor: true },
          { name: "Expense tracking", midday: true, competitor: true },
          { name: "Bank connections", midday: "25,000+ banks", competitor: "Limited" },
          { name: "AI-powered insights", midday: true, competitor: false },
          { name: "Receipt matching", midday: "Automatic", competitor: "Manual" },
        ],
      },
      {
        category: "Workflow",
        features: [
          { name: "Weekly financial summaries", midday: true, competitor: false },
          { name: "Unified dashboard", midday: true, competitor: false },
          { name: "Project-based billing", midday: true, competitor: true },
          { name: "Recurring invoices", midday: true, competitor: true },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Lite",
          price: "$19",
          period: "/month",
          features: [
            "5 billable clients",
            "Unlimited invoices",
            "Expense tracking",
            "Time tracking",
          ],
        },
        {
          name: "Plus",
          price: "$33",
          period: "/month",
          features: [
            "50 billable clients",
            "Automatic receipt capture",
            "Double-entry accounting",
            "Business health reports",
          ],
        },
        {
          name: "Premium",
          price: "$60",
          period: "/month",
          features: [
            "Unlimited clients",
            "Project profitability",
            "Email customization",
            "Dedicated support",
          ],
        },
      ],
      competitorNote: "Client limits can be restrictive as you grow",
    },
    switchingSteps: [
      {
        title: "Export invoices and clients",
        description: "Download your client list and invoice history from FreshBooks.",
      },
      {
        title: "Create your Midday account",
        description: "Sign up and connect your bank accounts for automatic transaction sync.",
      },
      {
        title: "Import your customer data",
        description: "Add your clients to start sending invoices right away.",
      },
      {
        title: "Set up your invoice template",
        description: "Customize your invoice design and payment terms in Midday.",
      },
    ],
    faq: [
      {
        question: "How does invoicing compare?",
        answer:
          "Both offer professional invoicing, but Midday connects your invoices directly to your bank transactions and provides AI-powered insights into your cash flow. You get the full picture, not just the invoice.",
      },
      {
        question: "What about the client limit?",
        answer:
          "Unlike FreshBooks, Midday doesn't limit how many clients you can bill. Pay one price and invoice as many clients as you need.",
      },
      {
        question: "Is time tracking included?",
        answer:
          "Yes, time tracking is included in all Midday plans and connects directly to invoicing and project tracking.",
      },
    ],
    targetAudience: [
      "Freelancers outgrowing FreshBooks client limits",
      "Founders who want more than just invoicing",
      "Teams that need better bank connectivity",
      "Users who want AI-powered financial insights",
    ],
  },
  {
    id: "xero",
    slug: "xero-alternative",
    name: "Xero",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Xero alternative? Midday offers founder-friendly financial management without the accounting complexity.",
    keyDifferences: [
      {
        title: "Design Philosophy",
        midday: "Built for founders",
        competitor: "Built for accountants",
      },
      {
        title: "Complexity",
        midday: "Simple and intuitive",
        competitor: "Full accounting system",
      },
      {
        title: "Setup Time",
        midday: "Under 5 minutes",
        competitor: "Hours to configure",
      },
      {
        title: "AI Features",
        midday: "Native AI assistant",
        competitor: "Third-party add-ons",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Bank feeds", midday: true, competitor: true },
          { name: "Invoicing", midday: true, competitor: true },
          { name: "Expense claims", midday: true, competitor: true },
          { name: "Time tracking", midday: "Built-in", competitor: "Add-on" },
          { name: "AI insights", midday: true, competitor: false },
          { name: "Receipt capture", midday: "Automatic", competitor: "Manual" },
        ],
      },
      {
        category: "Ease of Use",
        features: [
          { name: "No accounting knowledge needed", midday: true, competitor: false },
          { name: "Quick setup", midday: true, competitor: false },
          { name: "Weekly summaries", midday: true, competitor: false },
          { name: "Clean dashboard", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Starter",
          price: "$29",
          period: "/month",
          features: [
            "Send 20 invoices",
            "Enter 5 bills",
            "Bank reconciliation",
            "Capture bills and receipts",
          ],
        },
        {
          name: "Standard",
          price: "$46",
          period: "/month",
          features: [
            "Unlimited invoices",
            "Unlimited bills",
            "Bulk reconcile",
            "Multi-currency",
          ],
        },
        {
          name: "Premium",
          price: "$62",
          period: "/month",
          features: [
            "Everything in Standard",
            "Multi-currency",
            "Expense management",
            "Project tracking",
          ],
        },
      ],
      competitorNote: "Invoice and bill limits on lower tiers",
    },
    switchingSteps: [
      {
        title: "Export your Xero data",
        description: "Download your contacts and transaction history as CSV files.",
      },
      {
        title: "Sign up for Midday",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Import customers",
        description: "Add your existing customers to continue invoicing.",
      },
      {
        title: "Let Midday sync automatically",
        description: "Your transactions will flow in automatically. No more manual reconciliation.",
      },
    ],
    faq: [
      {
        question: "Is Midday suitable for complex accounting needs?",
        answer:
          "Midday is designed for founders who want clarity over their finances, not complex accounting. If you need features like multi-entity consolidation or detailed inventory tracking, Xero might be more appropriate. But for most founders and small teams, Midday provides everything you need with far less complexity.",
      },
      {
        question: "Can I still work with my accountant?",
        answer:
          "Absolutely. You can export your data anytime or invite your accountant to access your Midday account directly.",
      },
      {
        question: "What about Xero's app marketplace?",
        answer:
          "Midday has a growing integration ecosystem, and many features that require add-ons in Xero (like time tracking) are built directly into Midday.",
      },
    ],
    targetAudience: [
      "Founders overwhelmed by Xero's complexity",
      "Small teams that don't need full accounting",
      "Users frustrated with Xero's invoice limits",
      "Teams wanting built-in time tracking",
    ],
  },
  {
    id: "wave",
    slug: "wave-alternative",
    name: "Wave",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Wave alternative? Midday offers premium features, better bank connectivity, and AI-powered insights at a fair price.",
    keyDifferences: [
      {
        title: "Bank Connectivity",
        midday: "25,000+ banks worldwide",
        competitor: "US and Canada only",
      },
      {
        title: "AI Features",
        midday: "Built-in AI assistant",
        competitor: "None",
      },
      {
        title: "Support",
        midday: "Included in all plans",
        competitor: "Paid add-on",
      },
      {
        title: "Revenue Model",
        midday: "Subscription (transparent)",
        competitor: "Free + payment fees",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", midday: true, competitor: true },
          { name: "Expense tracking", midday: true, competitor: true },
          { name: "Bank connections", midday: "Global", competitor: "US/Canada" },
          { name: "Receipt scanning", midday: true, competitor: true },
          { name: "Time tracking", midday: true, competitor: false },
          { name: "AI insights", midday: true, competitor: false },
        ],
      },
      {
        category: "Business Features",
        features: [
          { name: "Weekly summaries", midday: true, competitor: false },
          { name: "Customer portal", midday: true, competitor: false },
          { name: "Multiple currencies", midday: true, competitor: "Limited" },
          { name: "Team collaboration", midday: true, competitor: "Limited" },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: [
            "Unlimited invoicing",
            "Expense tracking",
            "Basic reports",
            "Single user",
          ],
        },
        {
          name: "Pro",
          price: "$16",
          period: "/month",
          features: [
            "Unlimited bank connections",
            "Unlimited receipt scanning",
            "Priority support",
          ],
        },
      ],
      competitorNote: "Payment processing fees: 2.9% + $0.60 per transaction",
    },
    switchingSteps: [
      {
        title: "Export from Wave",
        description: "Download your customer list and transaction data from Wave.",
      },
      {
        title: "Create your Midday account",
        description: "Sign up and connect your bank accounts globally.",
      },
      {
        title: "Import your data",
        description: "Add your customers and start with a clean slate.",
      },
      {
        title: "Enjoy premium features",
        description: "Access time tracking, AI insights, and global bank support.",
      },
    ],
    faq: [
      {
        question: "Why pay for Midday when Wave is free?",
        answer:
          "Wave's free model is supported by payment processing fees and limited features. Midday includes time tracking, AI insights, global bank support, and priority support. For growing businesses, the value far exceeds the cost.",
      },
      {
        question: "What if I'm outside the US or Canada?",
        answer:
          "Midday connects to over 25,000 banks worldwide. Wave's bank connections are limited to North America.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes, Midday offers a 14-day free trial so you can experience all features before committing.",
      },
    ],
    targetAudience: [
      "Users outside North America needing bank connections",
      "Growing businesses needing time tracking",
      "Teams wanting AI-powered insights",
      "Users needing better support",
    ],
  },
  {
    id: "zoho-books",
    slug: "zoho-books-alternative",
    name: "Zoho Books",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Zoho Books alternative? Midday offers a cleaner, more focused experience without the complexity of a massive software suite.",
    keyDifferences: [
      {
        title: "Focus",
        midday: "Purpose-built for founders",
        competitor: "Part of large software suite",
      },
      {
        title: "Simplicity",
        midday: "One tool, one login",
        competitor: "Complex ecosystem",
      },
      {
        title: "Interface",
        midday: "Modern, clean design",
        competitor: "Dated, busy interface",
      },
      {
        title: "AI Features",
        midday: "Native AI assistant",
        competitor: "Zia AI (limited)",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", midday: true, competitor: true },
          { name: "Expense tracking", midday: true, competitor: true },
          { name: "Bank feeds", midday: true, competitor: true },
          { name: "Time tracking", midday: "Built-in", competitor: "Separate app" },
          { name: "AI insights", midday: true, competitor: "Basic" },
          { name: "Receipt capture", midday: true, competitor: true },
        ],
      },
      {
        category: "User Experience",
        features: [
          { name: "Modern interface", midday: true, competitor: false },
          { name: "Single platform", midday: true, competitor: false },
          { name: "No upsells", midday: true, competitor: false },
          { name: "Weekly summaries", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["1,000 invoices/year", "1 user", "Limited features"],
        },
        {
          name: "Standard",
          price: "$20",
          period: "/month",
          features: ["5,000 invoices/year", "3 users", "Bank feeds"],
        },
        {
          name: "Professional",
          price: "$50",
          period: "/month",
          features: ["Unlimited invoices", "5 users", "Purchase orders"],
        },
      ],
      competitorNote: "Time tracking requires Zoho Projects (additional cost)",
    },
    switchingSteps: [
      {
        title: "Export from Zoho Books",
        description: "Download your contacts and transactions as CSV files.",
      },
      {
        title: "Sign up for Midday",
        description: "Create your account in minutes.",
      },
      {
        title: "Connect your banks",
        description: "Link your bank accounts for automatic transaction sync.",
      },
      {
        title: "Start fresh",
        description: "Enjoy a simpler, more focused financial workspace.",
      },
    ],
    faq: [
      {
        question: "What about the Zoho ecosystem?",
        answer:
          "If you're heavily invested in Zoho's suite, their integrations can be valuable. But if you find yourself only using Zoho Books and paying for complexity you don't need, Midday offers a cleaner alternative.",
      },
      {
        question: "Is time tracking really included?",
        answer:
          "Yes! Unlike Zoho, which requires a separate Zoho Projects subscription for time tracking, Midday includes it in all plans.",
      },
      {
        question: "Can I migrate my data?",
        answer:
          "Yes, you can export your data from Zoho Books and set up fresh in Midday. Your bank transactions will sync automatically.",
      },
    ],
    targetAudience: [
      "Users overwhelmed by Zoho's ecosystem",
      "Teams wanting time tracking included",
      "Founders preferring modern interfaces",
      "Users tired of constant upsells",
    ],
  },
  {
    id: "harvest",
    slug: "harvest-alternative",
    name: "Harvest",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Harvest alternative? Midday combines time tracking with full financial management, invoicing, and AI-powered insights.",
    keyDifferences: [
      {
        title: "Scope",
        midday: "Complete financial workspace",
        competitor: "Time tracking focused",
      },
      {
        title: "Bank Integration",
        midday: "Full bank connectivity",
        competitor: "None",
      },
      {
        title: "Financial Insights",
        midday: "AI-powered analytics",
        competitor: "Time reports only",
      },
      {
        title: "Value",
        midday: "All-in-one solution",
        competitor: "Need additional tools",
      },
    ],
    features: [
      {
        category: "Time & Projects",
        features: [
          { name: "Time tracking", midday: true, competitor: true },
          { name: "Project tracking", midday: true, competitor: true },
          { name: "Team timesheets", midday: true, competitor: true },
          { name: "Budget tracking", midday: true, competitor: true },
          { name: "Invoicing from time", midday: true, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Bank connections", midday: true, competitor: false },
          { name: "Expense tracking", midday: true, competitor: true },
          { name: "Transaction categorization", midday: true, competitor: false },
          { name: "AI insights", midday: true, competitor: false },
          { name: "Cash flow visibility", midday: true, competitor: false },
          { name: "Weekly summaries", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["1 seat", "2 projects", "Basic features"],
        },
        {
          name: "Pro",
          price: "$12",
          period: "/seat/month",
          features: ["Unlimited projects", "Invoicing", "Integrations"],
        },
      ],
      competitorNote: "Per-seat pricing adds up quickly for teams",
    },
    switchingSteps: [
      {
        title: "Export your Harvest data",
        description: "Download your projects, clients, and time entries.",
      },
      {
        title: "Create your Midday account",
        description: "Sign up and connect your bank accounts.",
      },
      {
        title: "Set up your projects",
        description: "Recreate your project structure for time tracking.",
      },
      {
        title: "Enjoy the full picture",
        description: "See time tracking alongside your complete finances.",
      },
    ],
    faq: [
      {
        question: "How does time tracking compare?",
        answer:
          "Midday offers comparable time tracking features, but connects them directly to your bank transactions, invoicing, and financial insights. You get the full picture of your business, not just hours tracked.",
      },
      {
        question: "What about team management?",
        answer:
          "Midday supports team members with time tracking and includes them in your overall business view. Unlike Harvest's per-seat pricing, Midday offers predictable team pricing.",
      },
      {
        question: "Can I still invoice based on tracked time?",
        answer:
          "Yes! You can create invoices directly from tracked time, just like in Harvest, but with the added benefit of seeing how those invoices flow into your overall financial picture.",
      },
    ],
    targetAudience: [
      "Teams needing more than just time tracking",
      "Founders wanting to see the full financial picture",
      "Users tired of per-seat pricing",
      "Businesses needing bank connectivity",
    ],
  },
  {
    id: "expensify",
    slug: "expensify-alternative",
    name: "Expensify",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for an Expensify alternative? Midday handles expenses as part of a complete financial workspace with invoicing, time tracking, and insights.",
    keyDifferences: [
      {
        title: "Scope",
        midday: "Complete financial workspace",
        competitor: "Expense management only",
      },
      {
        title: "Simplicity",
        midday: "One tool for everything",
        competitor: "Single-purpose tool",
      },
      {
        title: "Pricing",
        midday: "Simple monthly fee",
        competitor: "Per-user pricing",
      },
      {
        title: "AI Features",
        midday: "Full AI assistant",
        competitor: "SmartScan only",
      },
    ],
    features: [
      {
        category: "Expense Management",
        features: [
          { name: "Receipt scanning", midday: true, competitor: true },
          { name: "Automatic categorization", midday: true, competitor: true },
          { name: "Bank connections", midday: true, competitor: true },
          { name: "Expense reports", midday: true, competitor: true },
          { name: "Mileage tracking", midday: false, competitor: true },
        ],
      },
      {
        category: "Additional Features",
        features: [
          { name: "Invoicing", midday: true, competitor: "Limited" },
          { name: "Time tracking", midday: true, competitor: false },
          { name: "AI insights", midday: true, competitor: false },
          { name: "Weekly summaries", midday: true, competitor: false },
          { name: "Project tracking", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Collect",
          price: "$5",
          period: "/user/month",
          features: [
            "Unlimited SmartScans",
            "Expense reports",
            "Basic approvals",
          ],
        },
        {
          name: "Control",
          price: "$9",
          period: "/user/month",
          features: [
            "Everything in Collect",
            "Company cards",
            "Advanced policies",
            "Multi-level approvals",
          ],
        },
      ],
      competitorNote: "Per-user pricing scales quickly",
    },
    switchingSteps: [
      {
        title: "Export from Expensify",
        description: "Download your expense reports and transaction history.",
      },
      {
        title: "Sign up for Midday",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Set up receipt forwarding",
        description: "Forward receipts via email or upload them directly.",
      },
      {
        title: "Enjoy the complete picture",
        description: "See expenses alongside invoices, time, and cash flow.",
      },
    ],
    faq: [
      {
        question: "Is receipt scanning as good as Expensify?",
        answer:
          "Midday uses advanced OCR and AI to capture receipt data automatically. While Expensify pioneered SmartScan, Midday's receipt capture is comparable and connects to your full financial picture.",
      },
      {
        question: "What about expense policies and approvals?",
        answer:
          "Midday is designed for founders and small teams where complex approval workflows aren't needed. If you require enterprise expense policies, Expensify may be more suitable.",
      },
      {
        question: "Can I track mileage?",
        answer:
          "Mileage tracking isn't built into Midday currently. If this is essential, you might use a dedicated mileage app alongside Midday for your other financial needs.",
      },
    ],
    targetAudience: [
      "Founders needing more than expense tracking",
      "Small teams tired of per-user pricing",
      "Users wanting invoicing and time tracking too",
      "Teams wanting a unified financial view",
    ],
  },
  {
    id: "mint",
    slug: "mint-alternative",
    name: "Mint",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Mint alternative for your business? Midday is built specifically for founders and small teams, not personal finance.",
    keyDifferences: [
      {
        title: "Purpose",
        midday: "Business finances",
        competitor: "Personal finance",
      },
      {
        title: "Invoicing",
        midday: "Full invoicing suite",
        competitor: "None",
      },
      {
        title: "Time Tracking",
        midday: "Built-in",
        competitor: "None",
      },
      {
        title: "Business Features",
        midday: "Receipts, projects, clients",
        competitor: "Personal budgets only",
      },
    ],
    features: [
      {
        category: "Financial Tracking",
        features: [
          { name: "Bank connections", midday: true, competitor: true },
          { name: "Transaction categorization", midday: true, competitor: true },
          { name: "Spending insights", midday: true, competitor: true },
          { name: "Cash flow tracking", midday: true, competitor: "Limited" },
          { name: "Business categorization", midday: true, competitor: false },
        ],
      },
      {
        category: "Business Features",
        features: [
          { name: "Invoicing", midday: true, competitor: false },
          { name: "Time tracking", midday: true, competitor: false },
          { name: "Receipt capture", midday: true, competitor: false },
          { name: "Client management", midday: true, competitor: false },
          { name: "AI assistant", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["Personal budgets", "Bill tracking", "Credit monitoring"],
        },
      ],
      competitorNote: "Mint is being sunset - Credit Karma now handles some features",
    },
    switchingSteps: [
      {
        title: "Separate personal and business",
        description: "Identify which accounts are for your business.",
      },
      {
        title: "Sign up for Midday",
        description: "Create your account and connect your business bank accounts.",
      },
      {
        title: "Set up business categories",
        description: "Midday's categories are designed for business expenses.",
      },
      {
        title: "Add invoicing and time tracking",
        description: "Start using the business features Mint never had.",
      },
    ],
    faq: [
      {
        question: "Why switch from Mint?",
        answer:
          "Mint was designed for personal finance. As a founder, you need invoicing, receipt tracking, time tracking, and business insights. Midday is purpose-built for running a business.",
      },
      {
        question: "What about personal finances?",
        answer:
          "We recommend keeping personal and business finances separate. Use Midday for your business, and a personal finance app for personal accounts.",
      },
      {
        question: "Is Midday free like Mint?",
        answer:
          "Midday is a paid service because running a business requires premium features and support. The value you get far exceeds the cost when you factor in time saved and insights gained.",
      },
    ],
    targetAudience: [
      "Founders using Mint for their business",
      "Users needing actual business features",
      "People starting a business and needing proper tools",
      "Mint users affected by the shutdown",
    ],
  },
  {
    id: "toggl",
    slug: "toggl-alternative",
    name: "Toggl",
    tagline: "Why Founders Switch to Midday",
    description:
      "Looking for a Toggl alternative? Midday combines time tracking with invoicing, transactions, and AI-powered insights for the complete picture.",
    keyDifferences: [
      {
        title: "Scope",
        midday: "Complete financial workspace",
        competitor: "Time tracking only",
      },
      {
        title: "Financial Integration",
        midday: "Bank connections included",
        competitor: "None",
      },
      {
        title: "Invoicing",
        midday: "Built-in from tracked time",
        competitor: "Requires separate tool",
      },
      {
        title: "Business Insights",
        midday: "AI-powered analytics",
        competitor: "Time reports only",
      },
    ],
    features: [
      {
        category: "Time Tracking",
        features: [
          { name: "Timer", midday: true, competitor: true },
          { name: "Manual entry", midday: true, competitor: true },
          { name: "Project tracking", midday: true, competitor: true },
          { name: "Team timesheets", midday: true, competitor: true },
          { name: "Desktop app", midday: true, competitor: true },
          { name: "Mobile app", midday: true, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Invoicing", midday: true, competitor: false },
          { name: "Bank connections", midday: true, competitor: false },
          { name: "Expense tracking", midday: true, competitor: false },
          { name: "Receipt capture", midday: true, competitor: false },
          { name: "Cash flow insights", midday: true, competitor: false },
          { name: "AI assistant", midday: true, competitor: false },
        ],
      },
    ],
    pricing: {
      midday: middayPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["Time tracking", "5 users", "Basic reports"],
        },
        {
          name: "Starter",
          price: "$10",
          period: "/user/month",
          features: ["Billable rates", "Project time estimates", "Alerts"],
        },
        {
          name: "Premium",
          price: "$20",
          period: "/user/month",
          features: ["Time audits", "Project forecasts", "Priority support"],
        },
      ],
      competitorNote: "Per-user pricing adds up for growing teams",
    },
    switchingSteps: [
      {
        title: "Export your Toggl data",
        description: "Download your projects, clients, and time entries as CSV.",
      },
      {
        title: "Create your Midday account",
        description: "Sign up and connect your bank accounts.",
      },
      {
        title: "Set up projects and clients",
        description: "Recreate your project structure in Midday.",
      },
      {
        title: "Start tracking with context",
        description: "See your time alongside invoices, expenses, and cash flow.",
      },
    ],
    faq: [
      {
        question: "Is time tracking as powerful as Toggl?",
        answer:
          "Midday offers solid time tracking with timers, manual entry, project tracking, and team support. While Toggl has some advanced features like automated tracking, Midday gives you time tracking plus complete financial management in one place.",
      },
      {
        question: "What about integrations?",
        answer:
          "Toggl has 100+ integrations, many for syncing time to other tools. Midday reduces integration needs by including invoicing and finances directly. You may need fewer tools overall.",
      },
      {
        question: "How does pricing compare?",
        answer:
          "Toggl charges per user, which adds up quickly. Midday's team pricing is more predictable, and you get invoicing, bank connections, and AI insights included.",
      },
    ],
    targetAudience: [
      "Founders needing more than time tracking",
      "Teams wanting invoicing from tracked time",
      "Users tired of per-seat pricing",
      "Businesses needing financial visibility",
    ],
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug);
}

export function getAllCompetitorSlugs(): string[] {
  return competitors.map((c) => c.slug);
}
