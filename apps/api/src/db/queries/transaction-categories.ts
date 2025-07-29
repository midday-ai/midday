import type { Database } from "@api/db";
import { transactionCategories } from "@api/db/schema";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export const getCategories = async (
  db: Database,
  params: GetCategoriesParams,
) => {
  const { teamId, limit = 1000 } = params;

  // First get all parent categories (categories with no parentId)
  const parentCategories = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      taxReportingCode: transactionCategories.taxReportingCode,
      parentId: transactionCategories.parentId,
      excluded: transactionCategories.excluded,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.teamId, teamId),
        isNull(transactionCategories.parentId),
      ),
    )
    .orderBy(
      desc(transactionCategories.createdAt),
      asc(transactionCategories.name),
    )
    .limit(limit);

  // Then get all child categories for these parents
  const childCategories = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      taxReportingCode: transactionCategories.taxReportingCode,
      parentId: transactionCategories.parentId,
      excluded: transactionCategories.excluded,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.teamId, teamId),
        isNotNull(transactionCategories.parentId),
      ),
    )
    .orderBy(asc(transactionCategories.name));

  // Group children by parentId for efficient lookup
  const childrenByParentId = new Map<string, typeof childCategories>();
  for (const child of childCategories) {
    if (child.parentId) {
      if (!childrenByParentId.has(child.parentId)) {
        childrenByParentId.set(child.parentId, []);
      }
      childrenByParentId.get(child.parentId)!.push(child);
    }
  }

  // Attach children to their parents
  return parentCategories.map((parent) => ({
    ...parent,
    children: childrenByParentId.get(parent.id) || [],
  }));
};

export type CreateTransactionCategoryParams = {
  teamId: string;
  name: string;
  color?: string | null;
  description?: string | null;
  taxRate?: number | null;
  taxType?: string | null;
  taxReportingCode?: string | null;
  parentId?: string | null;
  excluded?: boolean;
};

export const createTransactionCategory = async (
  db: Database,
  params: CreateTransactionCategoryParams,
) => {
  const {
    teamId,
    name,
    color,
    description,
    taxRate,
    taxType,
    taxReportingCode,
    parentId,
    excluded,
  } = params;

  const [result] = await db
    .insert(transactionCategories)
    .values({
      teamId,
      name,
      color,
      description,
      taxRate,
      taxType,
      taxReportingCode,
      parentId,
      excluded,
    })
    .returning();

  return result;
};

export type CreateTransactionCategoriesParams = {
  teamId: string;
  categories: {
    name: string;
    color?: string | null;
    description?: string | null;
    taxRate?: number | null;
    taxType?: string | null;
    taxReportingCode?: string | null;
    parentId?: string | null;
    excluded?: boolean;
  }[];
};

export const createTransactionCategories = async (
  db: Database,
  params: CreateTransactionCategoriesParams,
) => {
  const { teamId, categories } = params;

  if (categories.length === 0) {
    return [];
  }

  return db
    .insert(transactionCategories)
    .values(
      categories.map((category) => ({
        ...category,
        teamId,
      })),
    )
    .returning();
};

export type UpdateTransactionCategoryParams = {
  id: string;
  teamId: string;
  name?: string;
  color?: string | null;
  description?: string | null;
  taxRate?: number | null;
  taxType?: string | null;
  taxReportingCode?: string | null;
  parentId?: string | null;
  excluded?: boolean;
};

export const updateTransactionCategory = async (
  db: Database,
  params: UpdateTransactionCategoryParams,
) => {
  const { id, teamId, ...updates } = params;

  const [result] = await db
    .update(transactionCategories)
    .set(updates)
    .where(
      and(
        eq(transactionCategories.id, id),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .returning();

  return result;
};

export type DeleteTransactionCategoryParams = {
  id: string;
  teamId: string;
};

export const deleteTransactionCategory = async (
  db: Database,
  params: DeleteTransactionCategoryParams,
) => {
  const [result] = await db
    .delete(transactionCategories)
    .where(
      and(
        eq(transactionCategories.id, params.id),
        eq(transactionCategories.teamId, params.teamId),
        eq(transactionCategories.system, false),
      ),
    )
    .returning();

  return result;
};

// Color palette for categories
const categoryColors = [
  "#00c969", // Green - Revenue
  "#e74c3c", // Red - COGS
  "#3498db", // Blue - Personnel
  "#9b59b6", // Purple - Facilities
  "#f39c12", // Orange - Technology
  "#1abc9c", // Teal - Sales & Marketing
  "#34495e", // Dark Gray - Professional Services
  "#e67e22", // Dark Orange - Travel
  "#2ecc71", // Light Green - Shipping
  "#8e44ad", // Dark Purple - Financial
  "#c0392b", // Dark Red - Tax Payments
  "#27ae60", // Forest Green - Owner Equity
  "#16a085", // Dark Teal - Assets
  "#d35400", // Burnt Orange - Liabilities
  "#7f8c8d", // Gray - System
];

const universalCategories = [
  // REVENUE (Parent) - Green family
  {
    name: "Revenue",
    slug: "revenue",
    color: categoryColors[0],
    children: [
      { name: "Income", slug: "income", color: "#00c969" }, // Legacy
      { name: "Sales", slug: "sales", color: "#10b981" },
      { name: "Services", slug: "services", color: "#059669" },
      { name: "Subscriptions", slug: "subscriptions", color: "#047857" },
      { name: "Consulting", slug: "consulting", color: "#065f46" },
      { name: "Licenses", slug: "licenses", color: "#6ee7b7" },
      { name: "Interest Income", slug: "interest-income", color: "#34d399" },
      { name: "Other Income", slug: "other-income", color: "#a7f3d0" },
    ],
  },

  // COST OF GOODS SOLD (Parent) - Red family
  {
    name: "Cost of Goods Sold",
    slug: "cost-of-goods-sold",
    color: categoryColors[1],
    children: [
      { name: "Materials", slug: "materials", color: "#dc2626" },
      { name: "Production", slug: "production", color: "#b91c1c" },
      { name: "Direct Labor", slug: "direct-labor", color: "#991b1b" },
      { name: "Freight In", slug: "freight-in", color: "#7f1d1d" },
      { name: "Subcontractors", slug: "subcontractors", color: "#ef4444" },
    ],
  },

  // PERSONNEL (Parent) - Blue family
  {
    name: "Personnel",
    slug: "personnel",
    color: categoryColors[2],
    children: [
      { name: "Salary", slug: "salary", color: "#d3e500" }, // Legacy (replaces "Wages")
      { name: "Benefits", slug: "benefits", color: "#2563eb" },
      { name: "Contractors", slug: "contractors", color: "#1d4ed8" },
      { name: "Training", slug: "training", color: "#1e40af" },
      { name: "Recruitment", slug: "recruitment", color: "#1e3a8a" },
    ],
  },

  // FACILITIES & OPERATIONS (Parent) - Purple family
  {
    name: "Facilities & Operations",
    slug: "facilities-operations",
    color: categoryColors[3],
    children: [
      { name: "Rent", slug: "rent", color: "#A843CB" }, // Legacy
      { name: "Office Supplies", slug: "office-supplies", color: "#bb4647" }, // Legacy (replaces "Supplies")
      {
        name: "Facilities Expenses",
        slug: "facilities-expenses",
        color: "#a8aabc",
      }, // Legacy (replaces "Maintenance")
      { name: "Utilities", slug: "utilities", color: "#7c3aed" },
      { name: "Insurance", slug: "insurance", color: "#6d28d9" },
    ],
  },

  // TECHNOLOGY (Parent) - Orange family
  {
    name: "Technology",
    slug: "technology",
    color: categoryColors[4],
    children: [
      { name: "Software", slug: "software", color: "#0064d9" }, // Legacy
      {
        name: "Internet And Telephone",
        slug: "internet-and-telephone",
        color: "#ff8976",
      }, // Legacy
      { name: "Hardware", slug: "hardware", color: "#ea580c" },
      { name: "Cloud Services", slug: "cloud-services", color: "#c2410c" },
      {
        name: "Telecommunications",
        slug: "telecommunications",
        color: "#9a3412",
      },
    ],
  },

  // SALES & MARKETING (Parent) - Teal family
  {
    name: "Sales & Marketing",
    slug: "sales-marketing",
    color: categoryColors[5],
    children: [
      { name: "Marketing", slug: "marketing", color: "#0891b2" },
      { name: "Advertising", slug: "advertising", color: "#0e7490" },
      { name: "Events", slug: "events", color: "#155e75" },
      {
        name: "Marketing Materials",
        slug: "marketing-materials",
        color: "#164e63",
      },
      {
        name: "Customer Acquisition",
        slug: "customer-acquisition",
        color: "#083344",
      },
      {
        name: "Sales Commissions",
        slug: "sales-commissions",
        color: "#06b6d4",
      },
    ],
  },

  // PROFESSIONAL SERVICES (Parent) - Gray family
  {
    name: "Professional Services",
    slug: "professional-services",
    color: categoryColors[6],
    children: [
      {
        name: "Legal & Accounting",
        slug: "legal-accounting",
        color: "#374151",
      },
      { name: "Consulting", slug: "consulting-expense", color: "#4b5563" },
      {
        name: "Financial Services",
        slug: "financial-services",
        color: "#6b7280",
      },
    ],
  },

  // TRAVEL & ENTERTAINMENT (Parent) - Yellow/Lime family
  {
    name: "Travel & Entertainment",
    slug: "travel-entertainment",
    color: categoryColors[7],
    children: [
      { name: "Travel", slug: "travel", color: "#abdd1d" }, // Legacy
      { name: "Meals", slug: "meals", color: "#1ADBDB" }, // Legacy
      { name: "Activity", slug: "activity", color: "#e5e926" }, // Legacy
      { name: "Vehicle", slug: "vehicle", color: "#84cc16" },
    ],
  },

  // SHIPPING & LOGISTICS (Parent) - Indigo family
  {
    name: "Shipping & Logistics",
    slug: "shipping-logistics",
    color: categoryColors[8],
    children: [
      { name: "Shipping Out", slug: "shipping-out", color: "#4f46e5" },
      { name: "Packaging", slug: "packaging", color: "#4338ca" },
      { name: "Logistics", slug: "logistics", color: "#3730a3" },
    ],
  },

  // FINANCIAL EXPENSES (Parent) - Pink family
  {
    name: "Financial Expenses",
    slug: "financial-expenses",
    color: categoryColors[9],
    children: [
      { name: "Fees", slug: "fees", color: "#40b9fe" }, // Legacy (covers bank fees and other fees)
      { name: "Interest Expense", slug: "interest-expense", color: "#be185d" },
      { name: "Loan Payments", slug: "loan-payments", color: "#9d174d" },
      {
        name: "Currency Exchange",
        slug: "currency-exchange",
        color: "#831843",
      },
      { name: "Bad Debts", slug: "bad-debts", color: "#701a75" },
      { name: "Depreciation", slug: "depreciation", color: "#ec4899" },
    ],
  },

  // TAX PAYMENTS (Parent) - Amber family
  {
    name: "Tax Payments",
    slug: "tax-payments",
    color: categoryColors[10],
    children: [
      { name: "Taxes", slug: "taxes", color: "#b39cd0" }, // Legacy
      {
        name: "Income Tax Payments",
        slug: "income-tax-payments",
        color: "#7c2d12",
      },
      {
        name: "VAT/Sales Tax Payments",
        slug: "vat-sales-tax-payments",
        color: "#92400e",
      },
      {
        name: "Payroll Tax Payments",
        slug: "payroll-tax-payments",
        color: "#a16207",
      },
      {
        name: "Property Tax Payments",
        slug: "property-tax-payments",
        color: "#b45309",
      },
      {
        name: "Other Tax Payments",
        slug: "other-tax-payments",
        color: "#c2410c",
      },
      {
        name: "Licenses & Permits",
        slug: "licenses-permits",
        color: "#d97706",
      },
    ],
  },

  // OWNER/EQUITY (Parent) - Emerald family
  {
    name: "Owner/Equity",
    slug: "owner-equity",
    color: categoryColors[11],
    children: [
      { name: "Owner Investment", slug: "owner-investment", color: "#047857" },
      { name: "Owner Withdrawal", slug: "owner-withdrawal", color: "#065f46" },
      { name: "Dividends", slug: "dividends", color: "#064e3b" },
      {
        name: "Retained Earnings",
        slug: "retained-earnings",
        color: "#10b981",
      },
    ],
  },

  // ASSETS (Parent) - Cyan family
  {
    name: "Assets",
    slug: "assets",
    color: categoryColors[12],
    children: [
      { name: "Cash", slug: "cash", color: "#0891b2" },
      { name: "Receivables", slug: "receivables", color: "#0e7490" },
      { name: "Inventory Assets", slug: "inventory-assets", color: "#155e75" },
      { name: "Equipment", slug: "equipment", color: "#e9be26" }, // Legacy (moved from Operations - it's a fixed asset)
      { name: "Fixed Assets", slug: "fixed-assets", color: "#164e63" },
      { name: "Investments", slug: "investments", color: "#083344" },
      { name: "Prepaid Expenses", slug: "prepaid-expenses", color: "#06b6d4" },
    ],
  },

  // LIABILITIES (Parent) - Rose family
  {
    name: "Liabilities",
    slug: "liabilities",
    color: categoryColors[13],
    children: [
      { name: "Payables", slug: "payables", color: "#be123c" },
      { name: "Accrued Expenses", slug: "accrued-expenses", color: "#9f1239" },
      { name: "Short Term Loans", slug: "short-term-loans", color: "#881337" },
      { name: "Long Term Loans", slug: "long-term-loans", color: "#4c0519" },
      {
        name: "Customer Deposits",
        slug: "customer-deposits",
        color: "#fb7185",
      },
    ],
  },

  // SYSTEM (Parent) - Slate family
  {
    name: "System",
    slug: "system",
    color: categoryColors[14],
    children: [
      { name: "Internal Transfer", slug: "transfer", color: "#ff902b" }, // Legacy (replaces "Transfers")
      { name: "Other", slug: "other", color: "hsl(var(--primary))" }, // Legacy
      { name: "Adjustments", slug: "adjustments", color: "#475569" },
      { name: "Uncategorized", slug: "uncategorized", color: "#64748b" },
    ],
  },
];

export async function createSystemCategories(
  dbOrTx: Database | any,
  teamId: string,
) {
  const executeInTransaction = async (tx: any) => {
    const createdCategories: { [slug: string]: string } = {};

    // First: Create universal parent categories
    for (const parentCategory of universalCategories) {
      const [parent] = await tx
        .insert(transactionCategories)
        .values({
          name: parentCategory.name,
          slug: parentCategory.slug,
          teamId,
          color: parentCategory.color,
          system: true,
          parentId: null, // Parent categories have no parent
          excluded: false, // System categories are included by default
        })
        .returning({
          id: transactionCategories.id,
          slug: transactionCategories.slug,
        });

      if (parent) {
        createdCategories[parent.slug!] = parent.id;
      }
    }

    // Second: Create all child categories (including legacy categories)
    for (const parentCategory of universalCategories) {
      const parentId = createdCategories[parentCategory.slug];

      if (parentId && parentCategory.children) {
        for (const child of parentCategory.children) {
          await tx.insert(transactionCategories).values({
            name: child.name,
            slug: child.slug,
            teamId,
            color: child.color || parentCategory.color, // Use child's color if specified, otherwise inherit parent color
            system: true,
            parentId, // Link to parent
            excluded: false, // System categories are included by default
          });
        }
      }
    }

    return createdCategories;
  };

  // If it's already a transaction, use it directly; otherwise create a new transaction
  if (dbOrTx.transaction) {
    return dbOrTx.transaction(executeInTransaction);
  }

  return executeInTransaction(dbOrTx);
}
