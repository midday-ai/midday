import type { CategoryHierarchy } from "./types";

export const CATEGORY_COLORS = {
  revenue: "#22c55e",
  "cost-of-goods-sold": "#ef4444",
  "sales-marketing": "#3b82f6",
  operations: "#f59e0b",
  "professional-services": "#8b5cf6",
  "human-resources": "#ec4899",
  "travel-entertainment": "#06b6d4",
  technology: "#10b981",
  "banking-finance": "#f97316",
  "assets-capex": "#6366f1",
  "liabilities-debt": "#84cc16",
  "taxes-government": "#dc2626",
  "owner-equity": "#059669",
  system: "#6b7280",
} as const;

export const CATEGORIES: CategoryHierarchy = [
  // 1. REVENUE
  {
    slug: "revenue",
    name: "Revenue",
    description: "All forms of business income and revenue streams",
    color: CATEGORY_COLORS.revenue,
    system: true,
    children: [
      // EXISTING SLUG - preserved ✅
      {
        slug: "income",
        name: "Income",
        description: "General business income",
        parentSlug: "revenue",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "product-sales",
        name: "Product Sales",
        description: "Revenue from product sales",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "service-revenue",
        name: "Service Revenue",
        description: "Revenue from services provided",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "consulting-revenue",
        name: "Consulting Revenue",
        description: "Revenue from consulting services",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "subscription-revenue",
        name: "Subscription Revenue",
        description: "Recurring subscription revenue",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "interest-income",
        name: "Interest Income",
        description: "Income from interest on investments or deposits",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "other-income",
        name: "Other Income",
        description: "Other miscellaneous income",
        parentSlug: "revenue",
        system: true,
      },
      // Revenue Adjustments
      {
        slug: "customer-refunds",
        name: "Customer Refunds",
        description: "Refunds issued to customers",
        parentSlug: "revenue",
        system: true,
      },
      {
        slug: "chargebacks-disputes",
        name: "Chargebacks & Disputes",
        description: "Chargebacks and payment disputes",
        parentSlug: "revenue",
        system: true,
      },
    ],
  },

  // 2. COST OF GOODS SOLD
  {
    slug: "cost-of-goods-sold",
    name: "Cost of Goods Sold",
    description: "Direct costs attributable to the production of goods sold",
    color: CATEGORY_COLORS["cost-of-goods-sold"],
    system: true,
    children: [
      {
        slug: "inventory",
        name: "Inventory",
        description: "Cost of inventory and raw materials",
        parentSlug: "cost-of-goods-sold",
        system: true,
      },
      {
        slug: "manufacturing",
        name: "Manufacturing",
        description: "Manufacturing and production costs",
        parentSlug: "cost-of-goods-sold",
        system: true,
      },
      {
        slug: "shipping-inbound",
        name: "Shipping (Inbound)",
        description: "Inbound shipping and logistics costs",
        parentSlug: "cost-of-goods-sold",
        system: true,
      },
      {
        slug: "duties-customs",
        name: "Duties & Customs",
        description: "Import duties and customs fees",
        parentSlug: "cost-of-goods-sold",
        system: true,
      },
    ],
  },

  // 3. SALES & MARKETING
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    description: "Sales and marketing expenses",
    color: CATEGORY_COLORS["sales-marketing"],
    system: true,
    children: [
      {
        slug: "marketing",
        name: "Marketing",
        description: "General marketing expenses",
        parentSlug: "sales-marketing",
        system: true,
      },
      {
        slug: "advertising",
        name: "Advertising",
        description: "Advertising and promotional costs",
        parentSlug: "sales-marketing",
        system: true,
      },
      {
        slug: "website",
        name: "Website",
        description: "Website development and maintenance",
        parentSlug: "sales-marketing",
        system: true,
      },
      {
        slug: "events",
        name: "Events",
        description: "Trade shows, conferences, and events",
        parentSlug: "sales-marketing",
        system: true,
      },
      {
        slug: "promotional-materials",
        name: "Promotional Materials",
        description: "Brochures, business cards, and promotional items",
        parentSlug: "sales-marketing",
        system: true,
      },
    ],
  },

  // 4. OPERATIONS
  {
    slug: "operations",
    name: "Operations",
    description: "Day-to-day operational expenses",
    color: CATEGORY_COLORS.operations,
    system: true,
    children: [
      // EXISTING SLUGS - preserved ✅
      {
        slug: "office-supplies",
        name: "Office Supplies",
        description: "Office supplies and materials",
        parentSlug: "operations",
        system: true,
      },
      {
        slug: "rent",
        name: "Rent",
        description: "Office rent and lease payments",
        parentSlug: "operations",
        system: true,
      },
      {
        slug: "equipment",
        name: "Equipment (Non-CapEx)",
        description: "Equipment purchases below capitalization threshold",
        parentSlug: "operations",
        system: true,
      },
      {
        slug: "internet-and-telephone",
        name: "Internet & Telephone",
        description: "Internet, phone, and communication services",
        parentSlug: "operations",
        system: true,
      },
      {
        slug: "facilities-expenses",
        name: "Facilities Expenses",
        description: "Building maintenance and facility costs",
        parentSlug: "operations",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "utilities",
        name: "Utilities",
        description: "Electricity, water, gas, and other utilities",
        parentSlug: "operations",
        system: true,
      },
      {
        slug: "shipping-outbound",
        name: "Shipping (Outbound)",
        description: "Outbound shipping to customers",
        parentSlug: "operations",
        system: true,
      },
    ],
  },

  // 5. PROFESSIONAL SERVICES
  {
    slug: "professional-services",
    name: "Professional Services",
    description: "Legal, accounting, and professional service fees",
    color: CATEGORY_COLORS["professional-services"],
    system: true,
    children: [
      {
        slug: "professional-services-fees",
        name: "Professional Services Fees",
        description: "Legal, accounting, and consulting fees",
        parentSlug: "professional-services",
        system: true,
      },
      {
        slug: "contractors",
        name: "Contractors",
        description: "Independent contractor payments",
        parentSlug: "professional-services",
        system: true,
      },
      {
        slug: "insurance",
        name: "Insurance",
        description: "Business insurance premiums",
        parentSlug: "professional-services",
        system: true,
      },
    ],
  },

  // 6. HUMAN RESOURCES
  {
    slug: "human-resources",
    name: "Human Resources",
    description: "Employee-related expenses",
    color: CATEGORY_COLORS["human-resources"],
    system: true,
    children: [
      // EXISTING SLUG - preserved ✅
      {
        slug: "salary",
        name: "Salary",
        description: "Employee salaries and wages",
        parentSlug: "human-resources",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "training",
        name: "Training",
        description: "Employee training and development",
        parentSlug: "human-resources",
        system: true,
      },
      {
        slug: "employer-taxes",
        name: "Employer Taxes",
        description: "Employer payroll taxes and contributions",
        parentSlug: "human-resources",
        system: true,
      },
      {
        slug: "benefits",
        name: "Benefits",
        description: "Employee benefits and healthcare",
        parentSlug: "human-resources",
        system: true,
      },
    ],
  },

  // 7. TRAVEL & ENTERTAINMENT
  {
    slug: "travel-entertainment",
    name: "Travel & Entertainment",
    description: "Business travel and entertainment expenses",
    color: CATEGORY_COLORS["travel-entertainment"],
    system: true,
    children: [
      // EXISTING SLUGS - preserved ✅
      {
        slug: "travel",
        name: "Travel",
        description: "Business travel expenses",
        parentSlug: "travel-entertainment",
        system: true,
      },
      {
        slug: "meals",
        name: "Meals",
        description: "Business meals and entertainment",
        parentSlug: "travel-entertainment",
        system: true,
      },
      {
        slug: "activity",
        name: "Activity",
        description: "Business entertainment activities",
        parentSlug: "travel-entertainment",
        system: true,
      },
    ],
  },

  // 8. TECHNOLOGY
  {
    slug: "technology",
    name: "Technology",
    description: "Technology and software expenses",
    color: CATEGORY_COLORS.technology,
    system: true,
    children: [
      // EXISTING SLUG - preserved ✅
      {
        slug: "software",
        name: "Software",
        description: "Software subscriptions and licenses",
        parentSlug: "technology",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "non-software-subscriptions",
        name: "Non-Software Subscriptions",
        description: "Other subscription services",
        parentSlug: "technology",
        system: true,
      },
    ],
  },

  // 9. BANKING & FINANCE
  {
    slug: "banking-finance",
    name: "Banking & Finance",
    description: "Banking, finance, and payment processing",
    color: CATEGORY_COLORS["banking-finance"],
    system: true,
    children: [
      // EXISTING SLUGS - preserved ✅
      {
        slug: "transfer",
        name: "Transfer",
        description: "Bank transfers and wire fees",
        parentSlug: "banking-finance",
        system: true,
      },
      {
        slug: "fees",
        name: "Banking Fees",
        description: "Bank account fees and charges",
        parentSlug: "banking-finance",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "credit-card-payment",
        name: "Credit Card Payment",
        description: "Credit card payments and fees",
        parentSlug: "banking-finance",
        system: true,
      },
      {
        slug: "loan-proceeds",
        name: "Loan Proceeds",
        description: "Proceeds from loans",
        parentSlug: "banking-finance",
        system: true,
      },
      {
        slug: "loan-principal-repayment",
        name: "Loan Principal Repayment",
        description: "Principal payments on loans",
        parentSlug: "banking-finance",
        system: true,
      },
      {
        slug: "interest-expense",
        name: "Interest Expense",
        description: "Interest payments on loans and credit",
        parentSlug: "banking-finance",
        system: true,
      },
      // Payment Platforms
      {
        slug: "payment-platform-payouts",
        name: "Payment Platform Payouts",
        description: "Payouts from payment platforms",
        parentSlug: "banking-finance",
        system: true,
      },
      {
        slug: "payment-processor-fees",
        name: "Payment Processor Fees",
        description: "Payment processing fees",
        parentSlug: "banking-finance",
        system: true,
      },
    ],
  },

  // 10. ASSETS & CAPEX
  {
    slug: "assets-capex",
    name: "Assets & CapEx",
    description: "Capital expenditures and asset purchases",
    color: CATEGORY_COLORS["assets-capex"],
    system: true,
    children: [
      {
        slug: "fixed-assets",
        name: "Fixed Assets",
        description: "Equipment, furniture, and other fixed assets",
        parentSlug: "assets-capex",
        system: true,
      },
      {
        slug: "prepaid-expenses",
        name: "Prepaid Expenses",
        description: "Prepaid insurance, rent, and other expenses",
        parentSlug: "assets-capex",
        system: true,
      },
    ],
  },

  // 11. LIABILITIES & DEBT
  {
    slug: "liabilities-debt",
    name: "Liabilities & Debt",
    description: "Liabilities and debt obligations",
    color: CATEGORY_COLORS["liabilities-debt"],
    system: true,
    children: [
      {
        slug: "leases",
        name: "Leases",
        description: "Lease obligations and payments",
        parentSlug: "liabilities-debt",
        system: true,
      },
      {
        slug: "deferred-revenue",
        name: "Deferred Revenue",
        description: "Unearned revenue and customer deposits",
        parentSlug: "liabilities-debt",
        system: true,
      },
    ],
  },

  // 12. TAXES & GOVERNMENT
  {
    slug: "taxes-government",
    name: "Taxes & Government",
    description: "Tax payments and government fees",
    color: CATEGORY_COLORS["taxes-government"],
    system: true,
    children: [
      // EXISTING SLUG - preserved ✅
      {
        slug: "taxes",
        name: "Taxes",
        description: "General tax payments",
        parentSlug: "taxes-government",
        system: true,
      },
      // NEW CATEGORIES
      {
        slug: "vat-gst-pst-qst-payments",
        name: "VAT/GST/PST/QST Payments",
        description: "Value-added tax and sales tax payments",
        parentSlug: "taxes-government",
        system: true,
      },
      {
        slug: "sales-use-tax-payments",
        name: "Sales/Use Tax Payments",
        description: "Sales and use tax payments",
        parentSlug: "taxes-government",
        system: true,
      },
      {
        slug: "income-tax-payments",
        name: "Income Tax Payments",
        description: "Corporate and personal income tax payments",
        parentSlug: "taxes-government",
        system: true,
      },
      {
        slug: "payroll-tax-remittances",
        name: "Payroll Tax Remittances",
        description: "Payroll tax payments to government",
        parentSlug: "taxes-government",
        system: true,
      },
      {
        slug: "government-fees",
        name: "Government Fees",
        description: "Licenses, permits, and government fees",
        parentSlug: "taxes-government",
        system: true,
      },
    ],
  },

  // 13. OWNER / EQUITY
  {
    slug: "owner-equity",
    name: "Owner / Equity",
    description: "Owner equity and investment transactions",
    color: CATEGORY_COLORS["owner-equity"],
    system: true,
    children: [
      {
        slug: "owner-draws",
        name: "Owner Draws",
        description: "Owner withdrawals from the business",
        parentSlug: "owner-equity",
        system: true,
      },
      {
        slug: "capital-investment",
        name: "Capital Investment",
        description: "Owner capital contributions",
        parentSlug: "owner-equity",
        system: true,
      },
      {
        slug: "charitable-donations",
        name: "Charitable Donations",
        description: "Business charitable contributions",
        parentSlug: "owner-equity",
        system: true,
      },
    ],
  },

  // 14. SYSTEM
  {
    slug: "system",
    name: "System",
    description: "System-generated categories",
    color: CATEGORY_COLORS.system,
    system: true,
    children: [
      // EXISTING SLUGS - preserved ✅
      {
        slug: "uncategorized",
        name: "Uncategorized",
        description: "Transactions that haven't been categorized",
        parentSlug: "system",
        system: true,
      },
      {
        slug: "other",
        name: "Other",
        description: "Other miscellaneous transactions",
        parentSlug: "system",
        system: true,
      },
    ],
  },
];
