import fs from "node:fs";
import path from "node:path";

type DocMetadata = {
  title: string;
  description: string;
  section?: string;
  order?: number;
};

type DocSection = {
  title: string;
  slug: string;
  docs: Array<{
    slug: string;
    title: string;
    description: string;
    order: number;
  }>;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match?.[1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock?.trim().split("\n") || [];
  const metadata: Partial<DocMetadata> = {};

  for (const line of frontMatterLines) {
    const [key, ...valueArr] = line.split(": ");
    if (key) {
      let value = valueArr.join(": ").trim();
      value = value.replace(/^['"](.*)['"]$/, "$1");
      const trimmedKey = key.trim();
      if (trimmedKey === "order") {
        metadata.order = Number.parseInt(value, 10);
      } else if (
        trimmedKey === "title" ||
        trimmedKey === "description" ||
        trimmedKey === "section"
      ) {
        metadata[trimmedKey] = value;
      }
    }
  }

  return { metadata: metadata as DocMetadata, content };
}

function getMDXFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

export function getDocsData() {
  const docsDir = path.join(process.cwd(), "src", "app", "docs", "content");

  if (!fs.existsSync(docsDir)) {
    return [];
  }

  const mdxFiles = getMDXFiles(docsDir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(docsDir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getDocBySlug(slug: string) {
  const docsDir = path.join(process.cwd(), "src", "app", "docs", "content");
  const filePath = path.join(docsDir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { metadata, content } = readMDXFile(filePath);
  return {
    metadata,
    slug,
    content,
  };
}

export function getAllDocSlugs(): string[] {
  const docsDir = path.join(process.cwd(), "src", "app", "docs", "content");

  if (!fs.existsSync(docsDir)) {
    return [];
  }

  const mdxFiles = getMDXFiles(docsDir);
  return mdxFiles.map((file) => path.basename(file, path.extname(file)));
}

// Navigation structure for the sidebar
export const docsNavigation: DocSection[] = [
  {
    title: "Getting Started",
    slug: "getting-started",
    docs: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "What is Midday?",
        order: 1,
      },
      {
        slug: "quick-start",
        title: "Quick Start",
        description: "Get running in 5 minutes",
        order: 2,
      },
      {
        slug: "desktop-app",
        title: "Desktop App",
        description: "Native macOS & Windows app",
        order: 3,
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Common issues & FAQ",
        order: 4,
      },
    ],
  },
  {
    title: "Banking",
    slug: "banking",
    docs: [
      {
        slug: "connect-bank-account",
        title: "Connect Bank",
        description: "Link your bank accounts",
        order: 1,
      },
      {
        slug: "import-transactions-csv",
        title: "Import CSV",
        description: "Import from any source",
        order: 2,
      },
      {
        slug: "auto-categorization",
        title: "Categorization",
        description: "Automatic categories",
        order: 3,
      },
      {
        slug: "categories-reference",
        title: "Categories Reference",
        description: "All categories explained",
        order: 4,
      },
      {
        slug: "use-tags",
        title: "Tags",
        description: "Organize transactions",
        order: 5,
      },
      {
        slug: "account-settings",
        title: "Account Settings",
        description: "Manage bank accounts",
        order: 6,
      },
      {
        slug: "multi-currency",
        title: "Multi-Currency",
        description: "Multiple currencies & exchange",
        order: 7,
      },
    ],
  },
  {
    title: "Receipts & Inbox",
    slug: "inbox",
    docs: [
      {
        slug: "receipt-matching",
        title: "Receipt Matching",
        description: "AI-powered matching",
        order: 1,
      },
      {
        slug: "forward-receipts-email",
        title: "Email Forwarding",
        description: "Forward receipts",
        order: 2,
      },
      {
        slug: "connect-gmail",
        title: "Gmail",
        description: "Auto-capture from Gmail",
        order: 3,
      },
      {
        slug: "connect-outlook",
        title: "Outlook",
        description: "Auto-capture from Outlook",
        order: 4,
      },
      {
        slug: "connect-slack",
        title: "Slack",
        description: "Share from Slack",
        order: 5,
      },
    ],
  },
  {
    title: "Vault",
    slug: "vault",
    docs: [
      {
        slug: "vault-file-storage",
        title: "File Storage",
        description: "Store documents",
        order: 1,
      },
    ],
  },
  {
    title: "Invoicing",
    slug: "invoicing",
    docs: [
      {
        slug: "create-invoice",
        title: "Create Invoice",
        description: "Send professional invoices",
        order: 1,
      },
      {
        slug: "customize-invoice-template",
        title: "Templates",
        description: "Brand your invoices",
        order: 2,
      },
      {
        slug: "set-up-recurring-invoice",
        title: "Recurring",
        description: "Automate billing",
        order: 3,
      },
      {
        slug: "accept-online-payments",
        title: "Online Payments",
        description: "Accept card payments",
        order: 4,
      },
      {
        slug: "track-invoice-status",
        title: "Track Status",
        description: "Payment tracking",
        order: 5,
      },
      {
        slug: "invoice-settings",
        title: "Invoice Settings",
        description: "Configure invoices",
        order: 6,
      },
    ],
  },
  {
    title: "Time Tracking",
    slug: "time-tracking",
    docs: [
      {
        slug: "create-project",
        title: "Projects",
        description: "Set up projects",
        order: 1,
      },
      {
        slug: "track-time-timer",
        title: "Track Time",
        description: "Timer and entries",
        order: 2,
      },
      {
        slug: "invoice-tracked-time",
        title: "Bill Time",
        description: "Turn time into invoices",
        order: 3,
      },
    ],
  },
  {
    title: "Customers",
    slug: "customers",
    docs: [
      {
        slug: "add-customer",
        title: "Add Customer",
        description: "Create customer profiles",
        order: 1,
      },
      {
        slug: "customer-portal",
        title: "Customer Portal",
        description: "Self-serve access",
        order: 2,
      },
    ],
  },
  {
    title: "Reports",
    slug: "reports",
    docs: [
      {
        slug: "understanding-metrics",
        title: "Understanding Metrics",
        description: "How metrics work",
        order: 1,
      },
      {
        slug: "view-revenue-profit",
        title: "Revenue & Profit",
        description: "Track your income",
        order: 2,
      },
      {
        slug: "check-runway",
        title: "Runway",
        description: "Cash runway analysis",
        order: 3,
      },
      {
        slug: "view-burn-rate",
        title: "Burn Rate",
        description: "Monthly spending",
        order: 4,
      },
      {
        slug: "share-report",
        title: "Share Reports",
        description: "Share with others",
        order: 5,
      },
    ],
  },
  {
    title: "Export & Integrations",
    slug: "export",
    docs: [
      {
        slug: "apps-overview",
        title: "Apps Overview",
        description: "All integrations",
        order: 1,
      },
      {
        slug: "export-transactions-csv",
        title: "Export CSV",
        description: "Download transactions",
        order: 2,
      },
      {
        slug: "connect-xero",
        title: "Xero",
        description: "Export to Xero",
        order: 3,
      },
      {
        slug: "connect-quickbooks",
        title: "QuickBooks",
        description: "Export to QuickBooks",
        order: 4,
      },
      {
        slug: "connect-fortnox",
        title: "Fortnox",
        description: "Export to Fortnox",
        order: 5,
      },
    ],
  },
  {
    title: "Assistant",
    slug: "assistant",
    docs: [
      {
        slug: "using-assistant",
        title: "Using Assistant",
        description: "Ask Midday anything",
        order: 1,
      },
      {
        slug: "assistant-mcp",
        title: "AI Tools (MCP)",
        description: "Cursor, Claude, ChatGPT",
        order: 2,
      },
    ],
  },
  {
    title: "Team & Settings",
    slug: "team",
    docs: [
      {
        slug: "invite-team-member",
        title: "Team Members",
        description: "Add your team",
        order: 1,
      },
      {
        slug: "notification-settings",
        title: "Notifications",
        description: "Configure alerts",
        order: 2,
      },
      {
        slug: "manage-subscription",
        title: "Billing",
        description: "Manage subscription",
        order: 3,
      },
    ],
  },
  {
    title: "Developer",
    slug: "developer",
    docs: [
      {
        slug: "api-reference",
        title: "API Reference",
        description: "REST API docs",
        order: 1,
      },
    ],
  },
];

export function getDocNavigation() {
  return docsNavigation;
}
