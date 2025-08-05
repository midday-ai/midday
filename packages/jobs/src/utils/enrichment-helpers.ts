import type { TransactionForEnrichment } from "@midday/db/queries";
import type { TransactionData, UpdateData } from "./enrichment-schema";
import { transactionCategories } from "./enrichment-schema";

/**
 * Generates the enrichment prompt for the LLM
 */
export function generateEnrichmentPrompt(
  transactionData: TransactionData[],
  batch: TransactionForEnrichment[],
): string {
  const transactionList = transactionData
    .map((tx, index) => {
      const transaction = batch[index];
      const hasExistingMerchant = transaction?.merchantName;

      return `${index + 1}. Description: "${tx.description}", Amount: ${tx.amount}, Currency: ${tx.currency}${hasExistingMerchant ? ` (Current Merchant: ${transaction.merchantName})` : ""}`;
    })
    .join("\n");

  const needsCategories = batch.some((tx) => !tx.categorySlug);

  let returnInstructions = "Return:\n";

  if (needsCategories) {
    returnInstructions +=
      "1. Legal entity name: Apply the transformation rules above\n";
    returnInstructions +=
      "2. Category: Select the best-fit category from the allowed list\n";
  } else {
    returnInstructions +=
      "Legal entity name: Apply the transformation rules above\n";
  }

  return `You are a legal entity identification system for business expense transactions.

TASK: For EVERY transaction, identify the formal legal business entity name with proper entity suffixes (Inc, LLC, Corp, Ltd, Co, etc.).

INPUT HIERARCHY (use in this priority order):
1. "Current Merchant": Existing name from provider → enhance to legal entity
2. "Counterparty": Bank-parsed name → identify legal entity
3. "Raw": Transaction description → extract legal entity
4. "Description": Additional context → supplement identification

TRANSFORMATION EXAMPLES:
✓ "Anthropic" → "Anthropic Inc"
✓ "Google Pay" → "Google LLC" 
✓ "AMZN MKTP" → "Amazon.com Inc"
✓ "Starbucks #1234" → "Starbucks Corporation"
✓ "MSFT*Office365" → "Microsoft Corporation"
✓ "Apple Store" → "Apple Inc"

REQUIREMENTS:
- Use official legal entity suffixes: Inc, LLC, Corp, Corporation, Ltd, Co, etc.
- Prefer the parent company's legal entity (Google LLC, not Google Pay LLC)
- Ignore location codes, store numbers, and transaction details
- If genuinely unknown, provide best cleaned/capitalized version available

${
  needsCategories
    ? `
CATEGORY RULES:
Categorize based on the primary business purpose and nature of the expense. Consider amount, merchant type, and business context.

• software - Digital tools and services for business operations
  ✓ SaaS platforms: Google Workspace, Microsoft 365, Adobe Creative Cloud, Slack, Zoom, Figma
  ✓ Development tools: GitHub, AWS, Azure, Vercel, Stripe, payment processors
  ✓ Business software: CRM systems, accounting software, project management tools
  ✓ Domain/hosting: GoDaddy, Cloudflare, hosting services, SSL certificates
  ✗ NOT: Physical hardware, mobile/internet service bills, app store purchases for games

• travel - Transportation and accommodation for business trips
  ✓ Transportation: Airlines, trains, buses, ride-sharing (Uber/Lyft), rental cars, gas during trips
  ✓ Accommodation: Hotels, Airbnb, business lodging
  ✓ Trip-related: Parking fees during travel, tolls, airport services
  ✗ NOT: Daily commute expenses, local parking, personal vehicle maintenance

• meals - Food and beverages for business purposes
  ✓ Business meals: Client dinners, team lunches, conference catering
  ✓ Business travel meals: Restaurant meals during business trips
  ✓ Office provisions: Catered meetings, employee meals, coffee/snacks for office
  ✗ NOT: Personal groceries, alcohol not for business entertainment, daily employee lunches

• office-supplies - Physical materials and small office items
  ✓ Stationery: Paper, pens, folders, notebooks, printing supplies
  ✓ Office materials: Staplers, scissors, calendars, whiteboards, basic storage
  ✓ Consumables: Ink cartridges, batteries, cleaning supplies for office use
  ✗ NOT: Expensive equipment >$500, furniture, technology devices

• equipment - Durable business assets and technology hardware
  ✓ Computing: Computers, laptops, tablets, monitors, keyboards, mice
  ✓ Communication: Phones, headsets, webcams, conferencing equipment
  ✓ Office equipment: Printers, scanners, shredders, furniture >$500
  ✓ Specialized tools: Industry-specific machinery, professional instruments
  ✗ NOT: Small supplies <$100, consumables, software licenses

• internet-and-telephone - Communication and connectivity services
  ✓ Internet services: Business internet, Wi-Fi plans, ISP bills
  ✓ Phone services: Business phone lines, mobile plans, VoIP services
  ✓ Communication tools: Video conferencing services, business messaging platforms
  ✗ NOT: Software subscriptions, streaming services, personal phone bills

• rent - Property and workspace costs
  ✓ Office space: Commercial rent, co-working memberships (WeWork, etc.)
  ✓ Storage: Warehouse rent, storage units for business
  ✓ Parking: Monthly parking fees, dedicated business parking spots
  ✗ NOT: Utilities (use facilities-expenses), equipment leasing, vehicle rentals

• facilities-expenses - Building operations and maintenance
  ✓ Utilities: Electricity, gas, water, waste management, heating/cooling
  ✓ Maintenance: Cleaning services, repairs, security systems, landscaping
  ✓ Building services: Elevator maintenance, HVAC servicing, pest control
  ✗ NOT: Rent payments, office supplies, equipment purchases

• activity - Professional development and business events
  ✓ Education: Conferences, workshops, training courses, certifications
  ✓ Networking: Business events, trade shows, professional association fees
  ✓ Team building: Corporate retreats, employee training sessions
  ✗ NOT: Personal education, entertainment not business-related, regular meals

• fees - Professional services and administrative costs
  ✓ Professional services: Legal fees, accounting, consulting, tax preparation
  ✓ Financial fees: Bank charges, payment processing, credit card fees, wire fees
  ✓ Business fees: License renewals, permits, registration fees, compliance costs
  ✗ NOT: Investment fees, personal banking charges, late payment penalties

• transfer - Movement of funds between accounts
  ✓ Internal transfers: Between business accounts, owner draws, capital contributions
  ✓ Payment transfers: Wire transfers, ACH transfers, loan payments
  ✓ Investment moves: Transfers to investment accounts, escrow payments
  ✗ NOT: Purchase transactions, refunds, fee payments

PRIORITIZATION RULES:
1. Choose the most specific category that fits (software over fees for SaaS)
2. Consider primary business purpose (Uber for client meeting = travel, not activity)
3. Amount context matters (small tech purchase = office-supplies, large = equipment)
4. When uncertain between categories, prefer the more specific business function
`
    : ""
}

${returnInstructions}

Transactions to process:
${transactionList}

Return exactly ${batch.length} results in order. Apply the transformation rules consistently.
`;
}

/**
 * Prepares transaction data for LLM processing
 */
export function prepareTransactionData(
  batch: TransactionForEnrichment[],
): TransactionData[] {
  return batch.map((tx) => {
    // Build a comprehensive description with all available information
    const parts: string[] = [];

    if (tx.counterpartyName) {
      parts.push(`Counterparty: ${tx.counterpartyName}`);
    }

    if (tx.name && tx.name !== tx.counterpartyName) {
      parts.push(`Raw: ${tx.name}`);
    }

    if (
      tx.description &&
      tx.description !== tx.counterpartyName &&
      tx.description !== tx.name
    ) {
      parts.push(`Description: ${tx.description}`);
    }

    // Fallback to just name if no counterparty
    const description = parts.length > 0 ? parts.join(" | ") : tx.name;

    return {
      description,
      amount: tx.amount.toString(),
      currency: tx.currency,
    };
  });
}

/**
 * Validates if a category is in the allowed list
 */
function isValidCategory(category: string): boolean {
  return transactionCategories.includes(
    category as (typeof transactionCategories)[number],
  );
}

/**
 * Prepares update data, enhancing merchant names to legal entity names and category classifications
 */
export function prepareUpdateData(
  transaction: {
    categorySlug: string | null;
    merchantName: string | null;
    amount: number;
  },
  result: { merchant: string | null; category: string },
): UpdateData {
  const updateData: UpdateData = {};

  // Always update merchantName if the LLM provides one
  // This allows enhancement of existing simplified names to formal legal entity names
  if (result.merchant) {
    updateData.merchantName = result.merchant;
  }

  const validCategory = isValidCategory(result.category);

  // Only update categorySlug if it's currently null AND amount is not positive
  // Positive amounts are typically income and shouldn't be categorized as business expenses
  if (!transaction.categorySlug && validCategory && transaction.amount <= 0) {
    updateData.categorySlug = result.category;
  }

  return updateData;
}
