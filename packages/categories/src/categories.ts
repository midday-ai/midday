import { getCategoryColor } from "./color-system";
import type { CategoryHierarchy } from "./types";

// Raw category definitions without colors
const RAW_CATEGORIES = [
  // 1. REVENUE
  {
    slug: "revenue",
    name: "Revenue",
    children: [
      { slug: "income", name: "Income" },
      { slug: "product-sales", name: "Product Sales" },
      { slug: "service-revenue", name: "Service Revenue" },
      { slug: "consulting-revenue", name: "Consulting Revenue" },
      { slug: "subscription-revenue", name: "Subscription Revenue" },
      { slug: "interest-income", name: "Interest Income" },
      { slug: "other-income", name: "Other Income" },
      // Revenue Adjustments
      { slug: "customer-refunds", name: "Customer Refunds" },
      { slug: "chargebacks-disputes", name: "Chargebacks & Disputes" },
    ],
  },

  // 2. COST OF GOODS SOLD
  {
    slug: "cost-of-goods-sold",
    name: "Cost of Goods Sold",
    children: [
      { slug: "inventory", name: "Inventory" },
      { slug: "manufacturing", name: "Manufacturing" },
      { slug: "shipping-inbound", name: "Shipping (Inbound)" },
      { slug: "duties-customs", name: "Duties & Customs" },
    ],
  },

  // 3. SALES & MARKETING
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    children: [
      { slug: "marketing", name: "Marketing" },
      { slug: "advertising", name: "Advertising" },
      { slug: "website", name: "Website" },
      { slug: "events", name: "Events" },
      { slug: "promotional-materials", name: "Promotional Materials" },
    ],
  },

  // 4. OPERATIONS
  {
    slug: "operations",
    name: "Operations",
    children: [
      { slug: "office-supplies", name: "Office Supplies" },
      { slug: "rent", name: "Rent" },
      { slug: "utilities", name: "Utilities" },
      { slug: "facilities-expenses", name: "Facilities Expenses" },
      { slug: "equipment", name: "Equipment" },
      { slug: "internet-and-telephone", name: "Internet & Telephone" },
      { slug: "shipping", name: "Shipping" },
    ],
  },

  // 5. PROFESSIONAL SERVICES
  {
    slug: "professional-services",
    name: "Professional Services",
    children: [
      {
        slug: "professional-services-fees",
        name: "Professional Services Fees",
      },
      { slug: "contractors", name: "Contractors" },
      { slug: "insurance", name: "Insurance" },
    ],
  },

  // 6. HUMAN RESOURCES
  {
    slug: "human-resources",
    name: "Human Resources",
    children: [
      { slug: "salary", name: "Salary" },
      { slug: "training", name: "Training" },
      { slug: "benefits", name: "Benefits" },
    ],
  },

  // 7. TRAVEL & ENTERTAINMENT
  {
    slug: "travel-entertainment",
    name: "Travel & Entertainment",
    children: [
      { slug: "travel", name: "Travel" },
      { slug: "meals", name: "Meals" },
      { slug: "activity", name: "Activity" },
    ],
  },

  // 8. TECHNOLOGY
  {
    slug: "technology",
    name: "Technology",
    children: [
      { slug: "software", name: "Software" },
      {
        slug: "non-software-subscriptions",
        name: "Non-Software Subscriptions",
      },
    ],
  },

  // 9. BANKING & FINANCE
  {
    slug: "banking-finance",
    name: "Banking & Finance",
    children: [
      { slug: "transfer", name: "Transfer" },
      {
        slug: "credit-card-payment",
        name: "Credit Card Payment",
        excluded: true,
      },
      { slug: "banking-fees", name: "Banking Fees" },
      { slug: "loan-proceeds", name: "Loan Proceeds" },
      { slug: "loan-principal-repayment", name: "Loan Principal Repayment" },
      { slug: "interest-expense", name: "Interest Expense" },
      // Payment Platforms
      { slug: "payouts", name: "Payouts" },
      { slug: "processor-fees", name: "Processor Fees" },
      { slug: "fees", name: "Fees" },
    ],
  },

  // 10. ASSETS
  {
    slug: "assets-capex",
    name: "Assets",
    children: [
      { slug: "fixed-assets", name: "Fixed Assets" },
      { slug: "prepaid-expenses", name: "Prepaid Expenses" },
    ],
  },

  // 11. LIABILITIES & DEBT
  {
    slug: "liabilities-debt",
    name: "Liabilities & Debt",
    children: [
      { slug: "leases", name: "Leases" },
      { slug: "deferred-revenue", name: "Deferred Revenue" },
    ],
  },

  // 12. TAXES & GOVERNMENT
  {
    slug: "taxes",
    name: "Taxes & Government",
    children: [
      { slug: "vat-gst-pst-qst-payments", name: "VAT/GST/PST/QST Payments" },
      { slug: "sales-use-tax-payments", name: "Sales & Use Tax Payments" },
      { slug: "income-tax-payments", name: "Income Tax Payments" },
      { slug: "payroll-tax-remittances", name: "Payroll Tax Remittances" },
      { slug: "employer-taxes", name: "Employer Taxes" },
      { slug: "government-fees", name: "Government Fees" },
    ],
  },

  // 13. OWNER / EQUITY
  {
    slug: "owner-equity",
    name: "Owner / Equity",
    children: [
      { slug: "owner-draws", name: "Owner Draws" },
      { slug: "capital-investment", name: "Capital Investment" },
      { slug: "charitable-donations", name: "Charitable Donations" },
    ],
  },

  // 14. SYSTEM
  {
    slug: "system",
    name: "System",
    children: [
      { slug: "uncategorized", name: "Uncategorized" },
      { slug: "other", name: "Other" },
      { slug: "internal-transfer", name: "Internal Transfer", excluded: true },
    ],
  },
] as const;

// Function to automatically apply colors and parentSlug to all categories
function applyColorsToCategories(
  rawCategories: typeof RAW_CATEGORIES,
): CategoryHierarchy {
  return rawCategories.map((parent) => ({
    ...parent,
    color: getCategoryColor(parent.slug),
    system: true,
    excluded: false, // Default to not excluded
    children: parent.children.map((child) => ({
      ...child,
      parentSlug: parent.slug, // Automatically add parentSlug
      color: getCategoryColor(child.slug),
      system: true,
      excluded: "excluded" in child ? child.excluded : false, // Respect excluded flag if set
    })),
  }));
}

export const CATEGORIES: CategoryHierarchy =
  applyColorsToCategories(RAW_CATEGORIES);
